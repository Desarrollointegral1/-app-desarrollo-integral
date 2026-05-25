"use client";

import { motion } from "framer-motion";
import { TeamMember } from "../data";

interface TeamSectionProps {
  team: TeamMember[];
}

export function TeamSection({ team }: TeamSectionProps) {
  return (
    <section id="equipo" className="team-section">
      <div className="container">
        <p className="section-eyebrow blur-reveal">Quiénes somos</p>
        <h2 className="section-h2 mask-reveal">Equipo</h2>

        <div className="team-grid">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              className="team-card fade-in"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 100,
                delay: i * 0.1,
              }}
              viewport={{ once: true, margin: "-100px" }}
              whileHover={{
                y: -8,
                boxShadow: "0 20px 40px rgba(200,169,110,0.2)",
              }}
            >
              {/* Member Image */}
              {member.image && (
                <div className="team-image-wrapper">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="team-image"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Member Info */}
              <div className="team-info">
                <h3 className="team-name">{member.name}</h3>
                <p className="team-role">{member.role}</p>
                <p className="team-bio">{member.bio}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
export default TeamSection;
