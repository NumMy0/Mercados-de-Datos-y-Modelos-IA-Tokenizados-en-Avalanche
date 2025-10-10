/**
 * Composable para transiciones con Motion for Vue
 * Proporciona configuraciones predefinidas de transiciones comunes
 */

export interface TransitionConfig {
  initial: Record<string, any>
  enter: Record<string, any>
  leave?: Record<string, any>
  hovered?: Record<string, any>
}

export const useTransitions = () => {
  // Transición fade básica
  const fadeIn = (delay = 0): TransitionConfig => ({
    initial: { opacity: 0 },
    enter: { 
      opacity: 1, 
      transition: { 
        duration: 500, 
        delay,
        ease: 'easeOut' 
      } 
    },
    leave: { 
      opacity: 0, 
      transition: { 
        duration: 300, 
        ease: 'easeIn' 
      } 
    }
  })

  // Transición slide desde abajo
  const slideUp = (delay = 0): TransitionConfig => ({
    initial: { opacity: 0, y: 50 },
    enter: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 600, 
        delay,
        ease: 'easeOut' 
      } 
    },
    leave: { 
      opacity: 0, 
      y: 50, 
      transition: { 
        duration: 300, 
        ease: 'easeIn' 
      } 
    }
  })

  // Transición slide desde la izquierda
  const slideLeft = (delay = 0): TransitionConfig => ({
    initial: { opacity: 0, x: -50 },
    enter: { 
      opacity: 1, 
      x: 0, 
      transition: { 
        duration: 600, 
        delay,
        ease: 'easeOut' 
      } 
    },
    leave: { 
      opacity: 0, 
      x: -50, 
      transition: { 
        duration: 300, 
        ease: 'easeIn' 
      } 
    }
  })

  // Transición slide desde la derecha
  const slideRight = (delay = 0): TransitionConfig => ({
    initial: { opacity: 0, x: 50 },
    enter: { 
      opacity: 1, 
      x: 0, 
      transition: { 
        duration: 600, 
        delay,
        ease: 'easeOut' 
      } 
    },
    leave: { 
      opacity: 0, 
      x: 50, 
      transition: { 
        duration: 300, 
        ease: 'easeIn' 
      } 
    }
  })

  // Transición scale para elementos que aparecen
  const scaleIn = (delay = 0): TransitionConfig => ({
    initial: { opacity: 0, scale: 0.8 },
    enter: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 500, 
        delay,
        ease: 'easeOut' 
      } 
    },
    leave: { 
      opacity: 0, 
      scale: 0.8, 
      transition: { 
        duration: 300, 
        ease: 'easeIn' 
      } 
    }
  })

  // Transición para modales
  const modalTransition = (): TransitionConfig => ({
    initial: { opacity: 0, scale: 0.9, y: 50 },
    enter: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { 
        duration: 400, 
        ease: 'easeOut' 
      } 
    },
    leave: { 
      opacity: 0, 
      scale: 0.9, 
      y: 50, 
      transition: { 
        duration: 200, 
        ease: 'easeIn' 
      } 
    }
  })

  // Transición para overlay de modales con blur
  const modalOverlay = (): TransitionConfig => ({
    initial: { opacity: 0 },
    enter: { 
      opacity: 1, 
      transition: { 
        duration: 300, 
        ease: 'easeOut' 
      } 
    },
    leave: { 
      opacity: 0, 
      transition: { 
        duration: 200, 
        ease: 'easeIn' 
      } 
    }
  })

  // Transición de hover para tarjetas
  const cardHover = (): TransitionConfig => ({
    initial: { scale: 1 },
    enter: { scale: 1 },
    hovered: { 
      scale: 1.05, 
      transition: { 
        duration: 200, 
        ease: 'easeOut' 
      } 
    }
  })

  // Transición staggered para listas
  const staggeredList = (index: number, baseDelay = 0): TransitionConfig => ({
    initial: { opacity: 0, y: 30 },
    enter: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 400, 
        delay: baseDelay + (index * 100),
        ease: 'easeOut' 
      } 
    }
  })

  // Transición para elementos de navegación
  const navTransition = (delay = 0): TransitionConfig => ({
    initial: { opacity: 0, y: -30 },
    enter: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 500, 
        delay,
        ease: 'easeOut' 
      } 
    }
  })

  // Transición para botones con efecto bounce
  const buttonBounce = (): TransitionConfig => ({
    initial: { scale: 1 },
    enter: { scale: 1 },
    hovered: { 
      scale: 1.05, 
      transition: { 
        duration: 150,
        ease: 'easeOut'
      } 
    }
  })

  return {
    fadeIn,
    slideUp,
    slideLeft,
    slideRight,
    scaleIn,
    modalTransition,
    modalOverlay,
    cardHover,
    staggeredList,
    navTransition,
    buttonBounce
  }
}