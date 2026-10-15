import Building3D from "../components/Building3D";
import { motion } from "motion/react";
import "./LandingPage.css";

const features = [
  {
    number: "01",
    icon: "◈",
    title: "Detect",
    description:
      "Discover equipment patterns and identify opportunities to reduce energy waste.",
  },
  {
    number: "02",
    icon: "⌁",
    title: "Simulate",
    description:
      "Explore what-if scenarios before making changes to your building.",
  },
  {
    number: "03",
    icon: "✳",
    title: "Recommend",
    description:
      "Turn energy insights into clear, actionable recommendations.",
  },
  {
    number: "04",
    icon: "↗",
    title: "Verify",
    description:
      "Track proposed actions and compare predictions with follow-up results.",
  },
];

export default function LandingPage({ onEnter }) {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <a href="#home" className="landing-brand">
          <span className="brand-mark">W</span>
          <span>
            WattProof <strong>Twin</strong>
          </span>
        </a>

        <div className="landing-nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#impact">Our vision</a>
        </div>

        <button className="nav-cta" onClick={onEnter}>
          Open dashboard <span>↗</span>
        </button>
      </nav>

      <main>
        <section className="landing-hero" id="home">
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />

          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="eyebrow">
              <span className="status-dot" />
              INTELLIGENCE FOR A BETTER BUILT WORLD
            </div>

            <h1>
              Your building.
              <br />
              <span>A smarter</span>
              <br />
              future.
            </h1>

            <p className="hero-description">
              See how your building uses energy. Simulate smarter decisions.
              Turn everyday insights into meaningful change.
            </p>

            <div className="hero-actions">
              <button className="primary-cta" onClick={onEnter}>
                Explore your Twin <span>↗</span>
              </button>
              <a className="secondary-cta" href="#how-it-works">
                Discover how it works <span>↓</span>
              </a>
            </div>

            <div className="hero-note">
              <span>✳</span>
              A smarter approach to building energy
            </div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.92, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="visual-label">
              <span className="status-dot" />
              DIGITAL TWIN / PREVIEW
            </div>

            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />

            <motion.div
              className="energy-particle particle-one"
              animate={{ y: [0, -13, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="energy-particle particle-two"
              animate={{ y: [0, 12, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            
<div className="building-scene building-scene-3d">
  <Building3D />
</div>

            <motion.div
              className="floating-card energy-card"
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <span className="mini-card-label">ENERGY INTELLIGENCE</span>
              <div className="energy-card-value">
                <span>↗</span> Explore
              </div>
              <span className="mini-card-caption">
                Understand your building
              </span>
            </motion.div>

            <motion.div
              className="floating-card twin-card"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity }}
            >
              <span className="twin-card-icon">✳</span>
              <div>
                <strong>One smarter twin.</strong>
                <p>Many better decisions.</p>
              </div>
            </motion.div>

            <div className="visual-caption">
              <span>01 /</span> Imagine what your building could become
            </div>
          </motion.div>

          <div className="hero-bottom-label">
            <span>DESIGNED FOR SMARTER BUILDINGS</span>
            <span>SCROLL TO EXPLORE ↓</span>
          </div>
        </section>

        <section className="landing-intro" id="impact">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65 }}
          >
            <span className="section-eyebrow">BEYOND THE DASHBOARD</span>
            <h2>
              Don't just monitor
              <br />
              energy. <span>Understand it.</span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.15 }}
          >
            Buildings are full of opportunities hiding in plain sight.
            WattProof Twin brings equipment insights, scenario simulation,
            and actionable decisions together in one experience.
          </motion.p>
        </section>

        <section className="landing-process" id="how-it-works">
          <div className="process-heading">
            <div>
              <span className="section-eyebrow">FROM INSIGHT TO ACTION</span>
              <h2>
                Every decision
                <br />
                <span>moves us forward.</span>
              </h2>
            </div>
            <p>
              A connected journey from discovering opportunities to
              understanding their impact.
            </p>
          </div>

          <div className="process-grid">
            {features.map((feature, index) => (
              <motion.article
                className="process-card"
                key={feature.number}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                whileHover={{ y: -6 }}
              >
                <div className="process-card-top">
                  <span>{feature.number}</span>
                  <span className="process-icon">{feature.icon}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="process-card-line" />
              </motion.article>
            ))}
          </div>
        </section>

        <section className="landing-final-cta">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-eyebrow">THE NEXT STEP STARTS HERE</span>
            <h2>
              Let's make every
              <br />
              <span>watt count.</span>
            </h2>
            <p>
              Explore your building, test a scenario, and discover a smarter
              way to think about energy.
            </p>
            <button className="primary-cta" onClick={onEnter}>
              Enter WattProof Twin <span>↗</span>
            </button>
          </motion.div>
        </section>
      </main>

      <footer className="landing-footer">
        <a href="#home" className="landing-brand">
          <span className="brand-mark">W</span>
          <span>
            WattProof <strong>Twin</strong>
          </span>
        </a>
        <span>Think smarter. Use energy better.</span>
        <a href="#home">Back to top ↑</a>
      </footer>
    </div>
  );
}
