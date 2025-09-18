'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface LoadingAnimationProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal' | 'pulse'
}

export function LoadingAnimation({ 
  message = "Thinking...", 
  size = 'md',
  variant = 'default' 
}: LoadingAnimationProps) {
  const sizeClasses = {
    sm: { container: 'py-4', ring: 'w-8 h-8', dots: 'w-6 h-6', dot: 'w-1.5 h-1.5', text: 'text-xs' },
    md: { container: 'py-6', ring: 'w-12 h-12', dots: 'w-8 h-8', dot: 'w-2 h-2', text: 'text-sm' },
    lg: { container: 'py-8', ring: 'w-16 h-16', dots: 'w-12 h-12', dot: 'w-3 h-3', text: 'text-base' }
  }
  
  const classes = sizeClasses[size]

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-3">
        <motion.div
          className={`${classes.ring} border-2 border-orange-200 dark:border-orange-700 border-t-orange-500 dark:border-t-orange-400 rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className={`${classes.text} text-gray-600 dark:text-gray-400 font-medium`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {message}
        </motion.span>
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`${classes.dot} bg-orange-500 dark:bg-orange-400 rounded-full`}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        <motion.span
          className={`${classes.text} text-gray-600 dark:text-gray-400 font-medium ml-2`}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {message}
        </motion.span>
      </div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div 
        className={`flex flex-col items-center justify-center ${classes.container}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {/* Main loading animation */}
        <div className="relative mb-4">
          {/* Outer ring */}
          <motion.div
            className={`${classes.ring} rounded-full border-2 border-orange-200 dark:border-orange-700`}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Inner spinning dots */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className={`${classes.dots} relative`}
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={`absolute ${classes.dot} bg-orange-500 dark:bg-orange-400 rounded-full`}
                  style={{
                    top: '50%',
                    left: '50%',
                    transformOrigin: '0 0',
                  }}
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 0.8, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                  initial={{
                    x: Math.cos((i * 120 * Math.PI) / 180) * (size === 'sm' ? 8 : size === 'md' ? 12 : 16) - (size === 'sm' ? 3 : size === 'md' ? 4 : 6),
                    y: Math.sin((i * 120 * Math.PI) / 180) * (size === 'sm' ? 8 : size === 'md' ? 12 : 16) - (size === 'sm' ? 3 : size === 'md' ? 4 : 6),
                  }}
                />
              ))}
            </motion.div>
          </div>
          
          {/* Center pulse */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className={`${size === 'sm' ? 'w-0.5 h-0.5' : size === 'md' ? 'w-1 h-1' : 'w-1.5 h-1.5'} bg-orange-600 dark:bg-orange-300 rounded-full`} />
          </motion.div>
        </div>
        
        {/* Animated text */}
        <motion.p
          className={`${classes.text} text-gray-600 dark:text-gray-400 font-medium`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {message}
        </motion.p>
        
        {/* Typing dots */}
        <div className="flex space-x-1 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`${size === 'sm' ? 'w-0.5 h-0.5' : 'w-1 h-1'} bg-gray-400 dark:bg-gray-500 rounded-full`}
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Simpler inline loading for smaller spaces
export function InlineLoading({ size = "sm" }: { size?: "sm" | "md" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6"
  }
  
  return (
    <motion.div
      className={`${sizeClasses[size]} border-2 border-orange-200 dark:border-orange-700 border-t-orange-500 dark:border-t-orange-400 rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  )
}

// Typing indicator for chat
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl max-w-fit">
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI is thinking...</span>
    </div>
  )
}

// Search loading with steps
export function SearchLoadingSteps({ currentStep }: { currentStep: string }) {
  const steps = [
    "Searching the web...",
    "Analyzing sources...", 
    "Generating response...",
    "Almost done..."
  ]
  
  return (
    <motion.div 
      className="flex flex-col items-center gap-4 py-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <LoadingAnimation message={currentStep} size="md" variant="default" />
      
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <motion.div
            key={step}
            className={`h-1 rounded-full transition-all duration-300 ${
              step === currentStep 
                ? 'w-8 bg-orange-500 dark:bg-orange-400' 
                : 'w-2 bg-gray-300 dark:bg-gray-600'
            }`}
            animate={step === currentStep ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        ))}
      </div>
    </motion.div>
  )
}