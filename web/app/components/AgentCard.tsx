"use client";

import { motion } from "framer-motion";

interface AgentCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  isSelected: boolean;
  onClick: () => void;
}

export function AgentCard({
  title,
  description,
  icon,
  isSelected,
  onClick,
}: AgentCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative p-6 rounded-lg cursor-pointer transition-all duration-300
        ${isSelected
          ? 'bg-gradient-to-br from-gold/20 to-gold/10 border-2 border-gold shadow-lg shadow-gold/20'
          : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-gold/30'
        }
      `}
    >
      {/* Icon */}
      <div className="text-4xl mb-4">{icon}</div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{description}</p>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />
        </div>
      )}

      {/* Hover effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-gold/0 to-gold/0 group-hover:from-gold/5 group-hover:to-gold/10 pointer-events-none transition-all duration-300" />
    </motion.div>
  );
}
