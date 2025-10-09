// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AIModelMarketplace
 * @dev Marketplace descentralizado para modelos IA tokenizados como NFTs
 * Incluye: creación de modelos, planes de licencia, compra/venta de NFTs
 */
contract AIModelMarketplace is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 public nextModelId = 1;

    // ========== ESTRUCTURAS ==========
    
    struct LicensePlan {
        uint256 price;      // Precio en wei
        uint256 duration;   // Duración en segundos
        string name;        // Nombre del plan
        bool active;        // Si el plan está activo
    }

    struct License {
        uint256 expiresAt;  // Timestamp de expiración
        uint256 planId;     // ID del plan usado
    }

    struct Model {
        uint256 id;
        address author;     // Owner actual del NFT
        string name;
        string ipfsHash;    // CID del modelo en IPFS
        uint256 basePrice;  // Precio base sugerido
        uint256[] planIds;  // IDs de planes asociados
        bool forSale;       // Si está a la venta
        uint256 salePrice;  // Precio de venta
    }

    // ========== STORAGE ==========
    
    mapping(uint256 => Model) public models;
    mapping(uint256 => mapping(uint256 => LicensePlan)) public modelLicensePlans;
    mapping(uint256 => uint256) public nextPlanIdForModel;
    mapping(uint256 => mapping(address => License)) public licenses;
    mapping(address => uint256) public pendingWithdrawals;
    uint256[] public allModelIds;

    // ========== EVENTOS ==========
    
    event ModelUploaded(address indexed author, uint256 indexed modelId);
    event LicensePlanCreated(uint256 indexed modelId, uint256 indexed planId, string name, uint256 price, uint256 duration);
    event LicensePurchased(address indexed buyer, uint256 indexed modelId, uint256 indexed planId, uint256 expiresAt);
    event ModelForSale(uint256 indexed modelId, uint256 price);
    event ModelSaleCancelled(uint256 indexed modelId);
    event ModelSold(uint256 indexed modelId, address indexed seller, address indexed buyer, uint256 price);
    event ModelTransferred(address indexed from, address indexed to, uint256 indexed modelId);
    event Withdrawal(address indexed to, uint256 amount);

    // ========== CONSTRUCTOR ==========
    
    constructor() ERC721("AI Model NFT", "AIMODEL") Ownable(msg.sender) {}

    // ========== FUNCIONES INTERNAS ==========
    
    /**
     * @dev Verifica si un modelo existe
     * CORRECCIÓN: Usa _ownerOf en lugar de _exists (deprecado)
     */
    function _modelExists(uint256 _modelId) internal view returns (bool) {
        return (_modelId > 0 && _modelId < nextModelId && _ownerOf(_modelId) != address(0));
    }

    // ========== FUNCIONES PRINCIPALES ==========
    
    /**
     * @notice Crea y mintea un nuevo modelo como NFT
     * @param _name Nombre del modelo
     * @param _ipfsHash CID del modelo en IPFS
     * @param _basePrice Precio base sugerido (puede ser 0)
     * @param _tokenURI URI de la metadata JSON
     */
    function uploadModel(
        string memory _name,
        string memory _ipfsHash,
        uint256 _basePrice,
        string memory _tokenURI
    ) external {
        uint256 modelId = nextModelId++;
        _safeMint(msg.sender, modelId);
        _setTokenURI(modelId, _tokenURI);

        models[modelId] = Model({
            id: modelId,
            author: msg.sender,
            name: _name,
            ipfsHash: _ipfsHash,
            basePrice: _basePrice,
            planIds: new uint256[](0),
            forSale: false,
            salePrice: 0
        });

        allModelIds.push(modelId);
        emit ModelUploaded(msg.sender, modelId);
    }

    /**
     * @notice Crea un plan de licencia para un modelo (solo owner)
     * @param _modelId ID del modelo
     * @param _name Nombre del plan
     * @param _price Precio en wei
     * @param _duration Duración en segundos
     */
    function createLicensePlan(
        uint256 _modelId,
        string memory _name,
        uint256 _price,
        uint256 _duration
    ) external {
        require(_modelExists(_modelId), "Model not found");
        require(ownerOf(_modelId) == msg.sender, "Only model owner can add plans");
        require(_duration > 0, "Duration must be positive");

        uint256 planId = nextPlanIdForModel[_modelId]++;
        modelLicensePlans[_modelId][planId] = LicensePlan({
            price: _price,
            duration: _duration,
            name: _name,
            active: true
        });
        models[_modelId].planIds.push(planId);

        emit LicensePlanCreated(_modelId, planId, _name, _price, _duration);
    }

    /**
     * @notice Activa o desactiva un plan (solo owner del modelo)
     */
    function setPlanActive(uint256 _modelId, uint256 _planId, bool _active) external {
        require(_modelExists(_modelId), "Model not found");
        require(ownerOf(_modelId) == msg.sender, "Only model owner");
        modelLicensePlans[_modelId][_planId].active = _active;
    }

    /**
     * @notice Compra una licencia para usar un modelo
     * @param _modelId ID del modelo
     * @param _planId ID del plan
     */
    function buyLicense(uint256 _modelId, uint256 _planId) external payable nonReentrant {
        require(_modelExists(_modelId), "Model not found");
        LicensePlan memory plan = modelLicensePlans[_modelId][_planId];
        require(plan.active && plan.price > 0, "Plan inactive or not exist");
        require(msg.value >= plan.price, "Insufficient payment");

        address author = ownerOf(_modelId);
        
        // Manejar reembolso primero (previene reentrancy)
        if (msg.value > plan.price) {
            uint256 refund = msg.value - plan.price;
            (bool refundSuccess, ) = payable(msg.sender).call{value: refund}("");
            require(refundSuccess, "Refund failed");
        }
        
        // Acreditar pago al owner (pull pattern)
        pendingWithdrawals[author] += plan.price;

        // Calcular nueva expiración (extender si ya existe)
        uint256 currentExpiry = licenses[_modelId][msg.sender].expiresAt;
        uint256 newExpiry = currentExpiry > block.timestamp ? 
            currentExpiry + plan.duration : 
            block.timestamp + plan.duration;

        licenses[_modelId][msg.sender] = License({
            expiresAt: newExpiry, 
            planId: _planId
        });

        emit LicensePurchased(msg.sender, _modelId, _planId, newExpiry);
    }

    /**
     * @notice Verifica si un usuario tiene licencia activa
     * @param _modelId ID del modelo
     * @param _user Dirección del usuario
     * @return bool true si tiene licencia activa
     */
    function hasActiveLicense(uint256 _modelId, address _user) public view returns (bool) {
        require(_modelExists(_modelId), "Model not found");
        return licenses[_modelId][_user].expiresAt > block.timestamp;
    }

    /**
     * @notice Obtiene el timestamp de expiración de una licencia
     */
    function getLicenseExpiry(uint256 _modelId, address _user) external view returns (uint256) {
        require(_modelExists(_modelId), "Model not found");
        return licenses[_modelId][_user].expiresAt;
    }

    /**
     * @notice Obtiene todos los planes de un modelo
     */
    function getPlans(uint256 _modelId) external view returns (LicensePlan[] memory) {
        require(_modelExists(_modelId), "Model not found");
        uint256 count = models[_modelId].planIds.length;
        LicensePlan[] memory out = new LicensePlan[](count);
        for (uint256 i = 0; i < count; i++) {
            uint256 pid = models[_modelId].planIds[i];
            out[i] = modelLicensePlans[_modelId][pid];
        }
        return out;
    }

    /**
     * @notice Pone un modelo a la venta (solo owner)
     * @param _modelId ID del modelo
     * @param _price Precio de venta en wei
     */
    function setModelForSale(uint256 _modelId, uint256 _price) external {
        require(_modelExists(_modelId), "Model not found");
        require(ownerOf(_modelId) == msg.sender, "Only owner can set for sale");
        require(_price > 0, "Price must be greater than 0");
        models[_modelId].forSale = true;
        models[_modelId].salePrice = _price;
        emit ModelForSale(_modelId, _price);
    }

    /**
     * @notice Cancela la venta de un modelo (solo owner)
     */
    function cancelSale(uint256 _modelId) external {
        require(_modelExists(_modelId), "Model not found");
        require(ownerOf(_modelId) == msg.sender, "Only owner can cancel sale");
        models[_modelId].forSale = false;
        models[_modelId].salePrice = 0;
        emit ModelSaleCancelled(_modelId);
    }

    /**
     * @notice Compra un modelo NFT a la venta
     * @param _modelId ID del modelo
     */
    function buyModel(uint256 _modelId) external payable nonReentrant {
        require(_modelExists(_modelId), "Model not found");
        require(models[_modelId].forSale, "Model not for sale");
        
        uint256 price = models[_modelId].salePrice;
        require(msg.value >= price, "Insufficient payment");
        require(price > 0, "Invalid price");

        address seller = ownerOf(_modelId);
        require(seller != address(0) && seller != msg.sender, "Invalid seller");

        // Manejar reembolso primero
        if (msg.value > price) {
            uint256 refund = msg.value - price;
            (bool refundSuccess, ) = payable(msg.sender).call{value: refund}("");
            require(refundSuccess, "Refund failed");
        }

        // Transferir NFT
        _transfer(seller, msg.sender, _modelId);
        models[_modelId].author = msg.sender;
        
        // Acreditar pago al vendedor (pull pattern)
        pendingWithdrawals[seller] += price;

        // Cancelar venta
        models[_modelId].forSale = false;
        models[_modelId].salePrice = 0;

        emit ModelSold(_modelId, seller, msg.sender, price);
        emit ModelTransferred(seller, msg.sender, _modelId);
    }

    /**
     * @notice Transfiere un modelo sin pago (regalo/donación)
     * @param _to Dirección del receptor
     * @param _modelId ID del modelo
     */
    function transferModel(address _to, uint256 _modelId) external {
        require(_modelExists(_modelId), "Model not found");
        require(ownerOf(_modelId) == msg.sender, "Only owner can transfer");
        require(_to != address(0), "Invalid recipient");
        
        _safeTransfer(msg.sender, _to, _modelId, "");
        
        // Actualizar author si el transferidor es el author actual
        if (models[_modelId].author == msg.sender) {
            models[_modelId].author = _to;
        }
        
        // Cancelar venta si existe
        models[_modelId].forSale = false;
        models[_modelId].salePrice = 0;

        emit ModelTransferred(msg.sender, _to, _modelId);
    }

    /**
     * @notice Retira fondos acumulados (pull pattern)
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdraw failed");
        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @notice Obtiene información completa de un modelo
     */
    function getModel(uint256 _modelId) external view returns (
        uint256 id,
        address author,
        string memory name,
        string memory ipfsHash,
        uint256 basePrice,
        bool forSale,
        uint256 salePrice,
        uint256 plansCount
    ) {
        require(_modelExists(_modelId), "Model not found");
        Model storage m = models[_modelId];
        return (
            m.id, 
            m.author, 
            m.name, 
            m.ipfsHash, 
            m.basePrice, 
            m.forSale, 
            m.salePrice, 
            m.planIds.length
        );
    }

    /**
     * @notice Obtiene todos los IDs de modelos creados
     */
    function getAllModelIds() external view returns (uint256[] memory) {
        return allModelIds;
    }

    /**
     * @notice Verifica si un usuario tiene licencia activa (función auxiliar)
     */
    function checkUserLicense(uint256 _modelId, address _user) external view returns (bool) {
        return hasActiveLicense(_modelId, _user);
    }

    /**
     * @notice Obtiene el total de modelos creados
     */
    function getTotalModels() external view returns (uint256) {
        return nextModelId - 1;
    }

    /**
     * @notice Obtiene información básica de múltiples modelos (para frontend)
     */
    function getModelsInfo(uint256[] calldata _modelIds) external view returns (
        uint256[] memory ids,
        address[] memory authors,
        string[] memory names,
        bool[] memory forSaleStatuses,
        uint256[] memory salePrices
    ) {
        uint256 length = _modelIds.length;
        ids = new uint256[](length);
        authors = new address[](length);
        names = new string[](length);
        forSaleStatuses = new bool[](length);
        salePrices = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            if (_modelExists(_modelIds[i])) {
                Model storage m = models[_modelIds[i]];
                ids[i] = m.id;
                authors[i] = m.author;
                names[i] = m.name;
                forSaleStatuses[i] = m.forSale;
                salePrices[i] = m.salePrice;
            }
        }
    }
}