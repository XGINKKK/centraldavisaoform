import { useState } from 'react'
import './App.css'

function App() {
  const [step, setStep] = useState(1)
  const [showRejection, setShowRejection] = useState(false)
  const [formData, setFormData] = useState({
    // SPIN Questions
    situation: '',
    problem: '',
    implication: '',
    // Qualificação
    acceptsPrivate: '',
    // Dados pessoais
    phone: '',
    name: '',
    email: ''
  })
  const [errors, setErrors] = useState({})

  const totalSteps = 8

  // Validação de telefone brasileiro
  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length === 10 || cleaned.length === 11
  }

  // Formatação de telefone
  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) return cleaned
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
    if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
  }

  // Validação de email
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleInputChange = (field, value) => {
    if (field === 'phone') {
      value = formatPhone(value)
    }
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const nextStep = () => {
    // Validações por etapa
    if (step === 1 && !formData.situation) {
      setErrors({ situation: 'Por favor, selecione uma opção' })
      return
    }
    if (step === 2 && !formData.problem) {
      setErrors({ problem: 'Por favor, selecione pelo menos uma opção' })
      return
    }
    if (step === 3 && !formData.implication) {
      setErrors({ implication: 'Por favor, selecione uma opção' })
      return
    }
    if (step === 4 && !formData.acceptsPrivate) {
      setErrors({ acceptsPrivate: 'Por favor, selecione uma opção' })
      return
    }
    if (step === 4 && formData.acceptsPrivate === 'nao') {
      setShowRejection(true)
      return
    }
    if (step === 5 && !validatePhone(formData.phone)) {
      setErrors({ phone: 'Telefone inválido. Digite um número válido com DDD' })
      return
    }
    if (step === 6 && formData.name.trim().length < 3) {
      setErrors({ name: 'Por favor, digite seu nome completo' })
      return
    }
    if (step === 7 && !validateEmail(formData.email)) {
      setErrors({ email: 'Email inválido' })
      return
    }

    setStep(prev => prev + 1)
  }

  const prevStep = () => {
    setStep(prev => Math.max(1, prev - 1))
  }

  const resetForm = () => {
    setShowRejection(false)
    setStep(1)
    setFormData({
      situation: '',
      problem: '',
      implication: '',
      acceptsPrivate: '',
      phone: '',
      name: '',
      email: ''
    })
  }

  const handleWhatsApp = () => {
    const phoneNumber = '5547989146073' // Central da Visão BC
    const message = `Olá! Quero agendar meu *Exame de Vista* na Central da Visão.

*Dados do Paciente:*
👤 Nome: ${formData.name}
📱 Telefone: ${formData.phone}
📧 Email: ${formData.email}

📋 *Informações:*
• Último exame: ${situationLabels[formData.situation]}
• Sintomas: ${problemLabels[formData.problem]}
• Impacto: ${implicationLabels[formData.implication]}`
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  // Labels para o resumo
  const situationLabels = {
    'menos1': 'Menos de 1 ano',
    '1a2': '1 a 2 anos',
    'mais2': 'Mais de 2 anos',
    'nunca': 'Nunca fiz'
  }

  const problemLabels = {
    'visao_embaçada': 'Visão embaçada',
    'dor_cabeca': 'Dores de cabeça',
    'vista_cansada': 'Vista cansada',
    'dificuldade_noite': 'Dificuldade à noite',
    'checkup': 'Apenas check-up'
  }

  const implicationLabels = {
    'trabalho': 'Afeta meu trabalho',
    'dirigir': 'Dificuldade para dirigir',
    'leitura': 'Problemas para ler',
    'qualidade': 'Reduz minha qualidade de vida',
    'prevencao': 'Quero prevenir problemas'
  }

  // Página de rejeição elegante
  if (showRejection) {
    return (
      <div className="app">
        <div className="form-container rejection-container">
          <div className="rejection-content">
            <div className="rejection-icon">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                <path d="M28 40L36 48L52 32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                <circle cx="40" cy="40" r="30" fill="url(#gradient)" opacity="0.1" />
                <defs>
                  <linearGradient id="gradient" x1="10" y1="10" x2="70" y2="70">
                    <stop stopColor="#3d3e91" />
                    <stop offset="1" stopColor="#5b5dbf" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="rejection-title">Que pena! 😔</h1>
            <p className="rejection-subtitle">
              Infelizmente, a <strong>Central da Visão</strong> trabalha apenas com atendimento <strong>particular</strong>.
            </p>

            <div className="rejection-info-box">
              <div className="rejection-info-item">
                <span className="rejection-info-icon">💎</span>
                <div>
                  <strong>Qualidade Premium</strong>
                  <p>Equipamentos de última geração e profissionais especializados</p>
                </div>
              </div>
              <div className="rejection-info-item">
                <span className="rejection-info-icon">⚡</span>
                <div>
                  <strong>Agilidade</strong>
                  <p>Resultado do exame na hora, sem burocracia</p>
                </div>
              </div>
              <div className="rejection-info-item">
                <span className="rejection-info-icon">💰</span>
                <div>
                  <strong>Investimento Justo</strong>
                  <p>Apenas R$ 180,00 pelo exame completo</p>
                </div>
              </div>
            </div>

            <p className="rejection-cta-text">
              Se mudar de ideia, ficaremos felizes em cuidar da sua visão! 👁️
            </p>

            <div className="rejection-buttons">
              <button className="btn-primary btn-large" onClick={resetForm}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Quero Agendar Particular
              </button>
            </div>

            <p className="rejection-footer">
              Central da Visão • Balneário Camboriú
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="form-container">
        <div className="header">
          <div className="logo-area">
            <div className="logo-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="currentColor">
                <ellipse cx="24" cy="24" rx="22" ry="14" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.8" />
                <circle cx="24" cy="24" r="8" fill="currentColor" />
                <circle cx="24" cy="24" r="4" fill="#1a1b4b" />
                <circle cx="26" cy="22" r="2" fill="white" opacity="0.8" />
              </svg>
            </div>
          </div>
          <h1>Central da Visão</h1>
          <p className="location">Balneário Camboriú</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
          </div>
          <p className="step-indicator">Etapa {step} de {totalSteps}</p>
        </div>

        <div className="form-content">
          {/* ===== SPIN ETAPA 1: SITUAÇÃO ===== */}
          {step === 1 && (
            <div className="step-wrapper">
              <div className="step-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3d3e91" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h2>Quando foi seu último exame de vista?</h2>
              <p className="info-text">Isso nos ajuda a entender melhor sua situação</p>
              <div className="radio-group">
                {[
                  { value: 'menos1', label: 'Menos de 1 ano', sub: 'Ótimo! Manter o acompanhamento' },
                  { value: '1a2', label: '1 a 2 anos', sub: 'Hora de atualizar' },
                  { value: 'mais2', label: 'Mais de 2 anos', sub: 'Importante verificar' },
                  { value: 'nunca', label: 'Nunca fiz exame', sub: 'Vamos cuidar disso!' }
                ].map(opt => (
                  <label key={opt.value} className={`radio-option ${formData.situation === opt.value ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="situation"
                      value={opt.value}
                      checked={formData.situation === opt.value}
                      onChange={(e) => handleInputChange('situation', e.target.value)}
                    />
                    <span className="radio-label">
                      <strong>{opt.label}</strong>
                      <small>{opt.sub}</small>
                    </span>
                  </label>
                ))}
              </div>
              {errors.situation && <p className="error">{errors.situation}</p>}
            </div>
          )}

          {/* ===== SPIN ETAPA 2: PROBLEMA ===== */}
          {step === 2 && (
            <div className="step-wrapper">
              <div className="step-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3d3e91" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <h2>Você tem sentido algum desses sintomas?</h2>
              <p className="info-text">Selecione o que mais se aplica a você</p>
              <div className="radio-group">
                {[
                  { value: 'visao_embaçada', label: 'Visão embaçada ou turva', sub: 'De perto ou de longe' },
                  { value: 'dor_cabeca', label: 'Dores de cabeça frequentes', sub: 'Especialmente após leitura' },
                  { value: 'vista_cansada', label: 'Vista cansada', sub: 'Ao usar celular/computador' },
                  { value: 'dificuldade_noite', label: 'Dificuldade para enxergar à noite', sub: 'Ao dirigir ou caminhar' },
                  { value: 'checkup', label: 'Nenhum sintoma, quero check-up', sub: 'Prevenção é importante!' }
                ].map(opt => (
                  <label key={opt.value} className={`radio-option ${formData.problem === opt.value ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="problem"
                      value={opt.value}
                      checked={formData.problem === opt.value}
                      onChange={(e) => handleInputChange('problem', e.target.value)}
                    />
                    <span className="radio-label">
                      <strong>{opt.label}</strong>
                      <small>{opt.sub}</small>
                    </span>
                  </label>
                ))}
              </div>
              {errors.problem && <p className="error">{errors.problem}</p>}
            </div>
          )}

          {/* ===== SPIN ETAPA 3: IMPLICAÇÃO ===== */}
          {step === 3 && (
            <div className="step-wrapper">
              <div className="step-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3d3e91" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2>Como isso tem afetado seu dia a dia?</h2>
              <p className="info-text">Entender o impacto nos ajuda a cuidar melhor de você</p>
              <div className="radio-group">
                {[
                  { value: 'trabalho', label: 'Afeta meu trabalho', sub: 'Produtividade reduzida' },
                  { value: 'dirigir', label: 'Dificuldade para dirigir', sub: 'Insegurança no trânsito' },
                  { value: 'leitura', label: 'Problemas para ler', sub: 'Livros, celular, documentos' },
                  { value: 'qualidade', label: 'Reduz minha qualidade de vida', sub: 'Atividades do dia a dia' },
                  { value: 'prevencao', label: 'Quero prevenir problemas', sub: 'Cuidar antes que piore' }
                ].map(opt => (
                  <label key={opt.value} className={`radio-option ${formData.implication === opt.value ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="implication"
                      value={opt.value}
                      checked={formData.implication === opt.value}
                      onChange={(e) => handleInputChange('implication', e.target.value)}
                    />
                    <span className="radio-label">
                      <strong>{opt.label}</strong>
                      <small>{opt.sub}</small>
                    </span>
                  </label>
                ))}
              </div>
              {errors.implication && <p className="error">{errors.implication}</p>}
            </div>
          )}

          {/* ===== SPIN ETAPA 4: NECESSIDADE-SOLUÇÃO + QUALIFICAÇÃO ===== */}
          {step === 4 && (
            <div className="step-wrapper">
              <div className="step-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3d3e91" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h2>Ótimo! Podemos ajudar você</h2>
              <p className="info-text">
                Um <strong>exame de vista completo</strong> pode resolver essas questões e prevenir problemas futuros.
              </p>
              <div className="value-box">
                <div className="value-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Exame completo com equipamentos modernos
                </div>
                <div className="value-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Profissionais especializados
                </div>
                <div className="value-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Resultado na hora
                </div>
                <div className="value-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Atendimento humanizado
                </div>
              </div>
              <p className="info-text price-reveal">
                Investimento: <strong className="price">R$ 180,00</strong>
              </p>
              <div className="radio-group">
                <label className={`radio-option highlight ${formData.acceptsPrivate === 'sim' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="acceptsPrivate"
                    value="sim"
                    checked={formData.acceptsPrivate === 'sim'}
                    onChange={(e) => handleInputChange('acceptsPrivate', e.target.value)}
                  />
                  <span className="radio-label">
                    <strong>Sim, quero agendar!</strong>
                    <small>Atendimento particular</small>
                  </span>
                </label>
                <label className={`radio-option muted ${formData.acceptsPrivate === 'nao' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="acceptsPrivate"
                    value="nao"
                    checked={formData.acceptsPrivate === 'nao'}
                    onChange={(e) => handleInputChange('acceptsPrivate', e.target.value)}
                  />
                  <span className="radio-label">
                    <strong>Preciso de convênio</strong>
                  </span>
                </label>
              </div>
              {errors.acceptsPrivate && <p className="error">{errors.acceptsPrivate}</p>}
            </div>
          )}

          {/* ===== ETAPA 5: TELEFONE ===== */}
          {step === 5 && (
            <div className="step-wrapper">
              <div className="step-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3d3e91" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <h2>Qual seu telefone?</h2>
              <p className="info-text">Para confirmarmos seu agendamento</p>
              <input
                type="tel"
                className="input-field"
                placeholder="(47) 98888-8888"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                maxLength={15}
                autoFocus
              />
              {errors.phone && <p className="error">{errors.phone}</p>}
            </div>
          )}

          {/* ===== ETAPA 6: NOME ===== */}
          {step === 6 && (
            <div className="step-wrapper">
              <div className="step-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3d3e91" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2>Qual seu nome completo?</h2>
              <input
                type="text"
                className="input-field"
                placeholder="Digite seu nome completo"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                autoFocus
              />
              {errors.name && <p className="error">{errors.name}</p>}
            </div>
          )}

          {/* ===== ETAPA 7: EMAIL ===== */}
          {step === 7 && (
            <div className="step-wrapper">
              <div className="step-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3d3e91" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2>Qual seu email?</h2>
              <p className="info-text">Para enviarmos a confirmação</p>
              <input
                type="email"
                className="input-field"
                placeholder="seuemail@exemplo.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                autoFocus
              />
              {errors.email && <p className="error">{errors.email}</p>}
            </div>
          )}

          {/* ===== ETAPA 8: FINALIZAÇÃO ===== */}
          {step === 8 && (
            <div className="step-wrapper success">
              <div className="success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2>Perfeito, {formData.name.split(' ')[0]}!</h2>
              <p className="info-text">Clique abaixo para agendar seu exame pelo WhatsApp</p>
              <div className="summary">
                <p><strong>Nome:</strong> {formData.name}</p>
                <p><strong>Telefone:</strong> {formData.phone}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <hr />
                <p><strong>Último exame:</strong> {situationLabels[formData.situation]}</p>
                <p><strong>Sintoma:</strong> {problemLabels[formData.problem]}</p>
              </div>
              <button className="btn-whatsapp" onClick={handleWhatsApp}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Agendar pelo WhatsApp
              </button>
            </div>
          )}
        </div>

        <div className="button-group">
          {step > 1 && step < 8 && (
            <button className="btn-secondary" onClick={prevStep}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Voltar
            </button>
          )}
          {step < 8 && (
            <button className="btn-primary" onClick={nextStep}>
              {step === 4 ? 'Quero agendar' : 'Continuar'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
