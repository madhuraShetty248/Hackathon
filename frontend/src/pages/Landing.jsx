import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import EarthBackground from '../components/EarthBackground'

function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const isKn = i18n.language === 'kn'
  return (
    <button
      type="button"
      className="lang-switcher"
      onClick={() => {
        const next = isKn ? 'en' : 'kn'
        i18n.changeLanguage(next)
        localStorage.setItem('lang', next)
      }}
      aria-label={isKn ? 'Switch to English' : 'ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ'}
    >
      {isKn ? 'EN' : 'ಕನ್ನಡ'}
    </button>
  )
}

export default function Landing() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()

  if (loading) return <div className="loading-screen"><div className="loader" /></div>
  if (user) return <Navigate to="/app" replace />

  return (
    <div className="landing-hf">
      <EarthBackground />
      <div className="landing-hf-bg" aria-hidden="true" />

      <header className="landing-hf-header">
        <div className="landing-hf-nav">
          <Link to="/" className="landing-hf-logo">{t('nav.logo')}</Link>
          <nav className="landing-hf-nav-links">
            <a href="#about">{t('nav.product')}</a>
            <a href="#features">{t('nav.features')}</a>
            <LanguageSwitcher />
            <Link to="/login">{t('nav.login')}</Link>
            <Link to="/register" className="btn-hf btn-hf-gold-outline">{t('nav.getStarted')}</Link>
          </nav>
        </div>
      </header>

      <section className="landing-hf-hero">
        <motion.h1 className="landing-hf-hero-title" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {t('hero.title')}
        </motion.h1>
        <motion.p className="landing-hf-hero-tagline" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          {t('hero.tagline')}
        </motion.p>
        <motion.p className="landing-hf-hero-subline" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          {t('hero.subline')}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <Link to="/register?ai=1" className="btn-hf btn-hf-gold btn-hf-cta">
            {t('hero.cta')}
          </Link>
        </motion.div>
        <motion.p className="landing-hf-scroll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          {t('hero.scroll')}
        </motion.p>
        <motion.span className="landing-hf-scroll-icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <ChevronDown size={20} />
        </motion.span>
      </section>

      <section id="about" className="landing-hf-section landing-hf-about">
        <div className="landing-hf-section-inner">
          <p className="landing-hf-label">{t('about.label')}</p>
          <h2 className="landing-hf-section-title">{t('about.title')}</h2>
          <p className="landing-hf-body">{t('about.body')}</p>
        </div>
      </section>

      <section id="features" className="landing-hf-section landing-hf-what">
        <p className="landing-hf-label">{t('whatWeDo.label')}</p>
        <h2 className="landing-hf-section-title">{t('whatWeDo.title')}</h2>
        <div className="landing-hf-cards">
          <motion.div className="landing-hf-card" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h3>{t('whatWeDo.ventureBuilding.title')}</h3>
            <p>{t('whatWeDo.ventureBuilding.desc')}</p>
          </motion.div>
          <motion.div className="landing-hf-card" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <h3>{t('whatWeDo.strategicInvestment.title')}</h3>
            <p>{t('whatWeDo.strategicInvestment.desc')}</p>
          </motion.div>
          <motion.div className="landing-hf-card" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <h3>{t('whatWeDo.growthPartnership.title')}</h3>
            <p>{t('whatWeDo.growthPartnership.desc')}</p>
          </motion.div>
        </div>
      </section>

      <section className="landing-hf-section landing-hf-portfolio">
        <p className="landing-hf-label">{t('portfolio.label')}</p>
        <h2 className="landing-hf-section-title">{t('portfolio.title')}</h2>
        <p className="landing-hf-portfolio-sub">{t('portfolio.subline')}</p>
        <Link to="/register" className="landing-hf-portfolio-link">{t('portfolio.viewFull')}</Link>
        <div className="landing-hf-stats">
          <div className="landing-hf-stat"><span className="landing-hf-stat-num">12+</span><span>{t('portfolio.ai')}</span></div>
          <div className="landing-hf-stat"><span className="landing-hf-stat-num">8+</span><span>{t('portfolio.fintech')}</span></div>
          <div className="landing-hf-stat"><span className="landing-hf-stat-num">6+</span><span>{t('portfolio.healthtech')}</span></div>
          <div className="landing-hf-stat"><span className="landing-hf-stat-num">15+</span><span>{t('portfolio.saas')}</span></div>
        </div>
      </section>

      <section className="landing-hf-section landing-hf-approach">
        <p className="landing-hf-label">{t('approach.label')}</p>
        <h2 className="landing-hf-section-title">{t('approach.title')}</h2>
        <div className="landing-hf-principles">
          {['01', '02', '03', '04'].map((key, i) => (
            <motion.div key={key} className="landing-hf-principle" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <span className="landing-hf-principle-num">{key}</span>
              <div>
                <h3>{t(`approach.${key}.title`)}</h3>
                <p>{t(`approach.${key}.desc`)}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="landing-hf-explore-label">{t('approach.explore')}</p>
        <nav className="landing-hf-footer-nav">
          <Link to="/">{t('footer.partners')}</Link>
          <a href="#about">{t('footer.team')}</a>
          <a href="#about">{t('footer.about')}</a>
          <Link to="/register">{t('footer.contact')}</Link>
        </nav>
      </section>

      <section className="landing-hf-cta">
        <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>{t('cta.powerUp')}</motion.h2>
        <motion.div className="landing-hf-cta-buttons" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Link to="/register" className="btn-hf btn-hf-primary">{t('cta.startFree')}</Link>
          <Link to="/login" className="btn-hf btn-hf-outline">{t('cta.login')}</Link>
        </motion.div>
      </section>

      <footer className="landing-hf-footer-full">
        <div className="landing-hf-footer-main">
          <div className="landing-hf-footer-brand">
            <Link to="/" className="landing-hf-footer-logo">{t('nav.logo')}</Link>
            <p className="landing-hf-footer-tagline">{t('footer.tagline')}</p>
          </div>
          <div className="landing-hf-footer-col">
            <p className="landing-hf-footer-heading">{t('footer.company')}</p>
            <a href="#about">{t('footer.about')}</a>
            <a href="#about">{t('footer.team')}</a>
            <Link to="/register">{t('footer.partners')}</Link>
            <Link to="/register">{t('footer.contact')}</Link>
          </div>
          <div className="landing-hf-footer-col">
            <p className="landing-hf-footer-heading">{t('footer.connect')}</p>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">{t('footer.linkedin')}</a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer">{t('footer.x')}</a>
          </div>
          <div className="landing-hf-footer-col landing-hf-footer-contact">
            <p className="landing-hf-footer-heading">{t('footer.contactLabel')}</p>
            <p>{t('footer.location')}</p>
            <p>{t('footer.locationLine2')}</p>
            <a href={`mailto:${t('footer.email')}`}>{t('footer.email')}</a>
            <a href="tel:+14159679406">{t('footer.phone')}</a>
          </div>
        </div>
        <div className="landing-hf-footer-bottom">
          <p>{t('footer.copyright')}</p>
          <nav>
            <a href="/privacy">{t('footer.privacy')}</a>
            <a href="/terms">{t('footer.terms')}</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
