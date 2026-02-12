import { useState, useEffect } from 'react'
import './App.css'
import { supabase } from './lib/supabase'
// n8n Webhook URL - CONFIGURE THIS
const N8N_WEBHOOK_URL = 'https://dinastia-n8n-webhook.qvhrom.easypanel.host/webhook/central-da-visao' // Substitua pela URL do seu webhook n8n

import Dashboard from './Dashboard'

function App() {
  const [step, setStep] = useState(1)
  const [showRejection, setShowRejection] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
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

  // Dashboard Route Check
  const [isDashboard, setIsDashboard] = useState(window.location.pathname === '/dashadmin')

  // Funnel Tracking State
  const [sessionId, setSessionId] = useState('')

  const totalSteps = 7

  // Facebook Pixel helper
  const trackPixelEvent = (eventName, params = {}) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', eventName, params)
    }
  }

  // Track step changes and PageView on mount
  useEffect(() => {
    // 1. Check if Dashboard
    if (window.location.pathname === '/dashadmin') {
      setIsDashboard(true)
      return
    }

    // 2. Generate Session ID for Funnel Tracking
    let currentSession = sessionStorage.getItem('funnel_session_id')
    if (!currentSession) {
      currentSession = crypto.randomUUID()
      sessionStorage.setItem('funnel_session_id', currentSession)
    }
    setSessionId(currentSession)

    // 3. Track Initial PageView & Step 1
    trackPixelEvent('PageView')
    trackFunnelStep(1, 'situation', currentSession)

  }, [])

  // Helper to track funnel steps in Supabase
  const trackFunnelStep = async (stepNum, stepName, activeSessionId = sessionId) => {
    if (!activeSessionId) return

    try {
      await supabase.from('funnel_events').insert({
        session_id: activeSessionId,
        step_number: stepNum,
        step_name: stepName,
        metadata: { timestamp: new Date().toISOString() }
      })
    } catch (err) {
      console.error('Tracking error:', err)
    }
  }

  useEffect(() => {
    if (step === 5) {
      trackPixelEvent('InitiateCheckout', {
        content_name: 'Exame de Vista',
        content_category: 'Health',
        value: 180,
        currency: 'BRL'
      })
    }

    // Track step progression
    const stepNames = {
      1: 'situation',
      2: 'problem',
      3: 'implication',
      4: 'qualification',
      5: 'phone', // whatsapp
      6: 'name',
      7: 'success'
    }
    if (step > 1 && sessionId) {
      trackFunnelStep(step, stepNames[step] || `step_${step}`)
    }

  }, [step])

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

  // Salvar lead no Supabase e chamar webhook
  const submitLead = async () => {
    if (isSubmitting || submitted) return

    setIsSubmitting(true)

    try {
      // 1. Salvar no Supabase
      const leadData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        situation: formData.situation,
        problem: formData.problem,
        implication: formData.implication
      }

      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
      }

      // 2. Chamar webhook do n8n (se configurado)
      if (N8N_WEBHOOK_URL && N8N_WEBHOOK_URL !== 'YOUR_N8N_WEBHOOK_URL') {
        try {
          const webhookPayload = {
            lead: {
              id: data?.id,
              nome: formData.name,
              telefone: formData.phone,
              email: formData.email
            },
            questionario: {
              ultimoExame: situationLabels[formData.situation],
              sintomas: problemLabels[formData.problem],
              impactoNoDiaADia: implicationLabels[formData.implication]
            },
            servico: {
              nome: 'Exame de Vista',
              valor: 'R$ 180,00',
              tipo: 'Particular'
            },
            clinica: {
              nome: 'Central da Visão',
              cidade: 'Balneário Camboriú',
              whatsapp: '5547989146073'
            },
            metadata: {
              dataHora: new Date().toISOString(),
              origem: 'Formulário Web',
              status: 'Novo Lead'
            }
          }

          const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookPayload)
          })

          if (!response.ok) throw new Error('Erro no webhook')

        } catch (webhookError) {
          console.error('Webhook error:', webhookError)
          // Mesmo com erro no webhook, seguimos pois o lead foi salvo no Supabase
        }
      }

      // 3. Facebook Pixel - Lead event (Client-side)
      trackPixelEvent('Lead', {
        content_name: 'Exame de Vista',
        content_category: 'Health',
        value: 180,
        currency: 'BRL'
      })

      setSubmitted(true)
      setIsSuccess(true) // Mostra tela de sucesso

    } catch (err) {
      console.error('Submit error:', err)
      // Opcional: Mostrar erro para o usuário
    } finally {
      setIsSubmitting(false)
    }
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

  if (isDashboard) {
    return <Dashboard />
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
              <span className="badge">✓ Atendimento Particular</span>
              <h2>Podemos ajudar você!</h2>
              <p className="info-text">
                Um <strong>exame de vista completo</strong> resolve essas questões e previne problemas futuros.
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
              <h2>Qual seu WhatsApp?</h2>
              <p className="info-text">É por ele que vamos confirmar seu agendamento</p>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                enterKeyHint="next"
                className="input-field"
                placeholder="(47) 98888-8888"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                maxLength={15}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
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
                autoComplete="name"
                enterKeyHint="next"
                className="input-field"
                placeholder="Digite seu nome completo"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && nextStep()}
              />
              {errors.name && <p className="error">{errors.name}</p>}
            </div>
          )}

          {/* ===== ETAPA 7: FINALIZAÇÃO / PENDING / SUCCESS ===== */}
          {step === 7 && (
            <div className={`step-wrapper ${isSuccess ? 'success-view' : ''}`}>

              {/* LOADING STATE - Waiting for n8n */}
              {isSubmitting && (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <h2>Enviando solicitação...</h2>
                  <p className="info-text">Aguarde um momento, estamos processando seu agendamento.</p>
                </div>
              )}

              {/* SUCCESS STATE - n8n responded */}
              {!isSubmitting && isSuccess && (
                <div className="success-content">
                  <div className="success-icon animate-pop">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h2>Solicitação Recebida!</h2>
                  <p className="info-text">Recebemos seus dados com sucesso.</p>

                  <div className="success-message-box">
                    <p>Vamos entrar em contato com você pelo WhatsApp <strong>{formData.phone}</strong> para finalizar o agendamento.</p>
                  </div>

                  <p className="footer-note">Central da Visão • Balneário Camboriú</p>
                </div>
              )}

              {/* INITIAL REVIEW STATE (Before click) */}
              {!isSubmitting && !isSuccess && (
                <>
                  <div className="success-icon icon-review">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3d3e91" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <h2>Confirme seus dados</h2>
                  <p className="info-text">Verifique se está tudo correto antes de enviar</p>
                  <div className="summary">
                    <p><strong>Nome:</strong> {formData.name}</p>
                    <p><strong>WhatsApp:</strong> {formData.phone}</p>
                    <hr />
                    <p><strong>Último exame:</strong> {situationLabels[formData.situation]}</p>
                    <p><strong>Sintoma:</strong> {problemLabels[formData.problem]}</p>
                  </div>
                  <button className="btn-primary btn-large" onClick={submitLead}>
                    Confirmar Solicitação
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="button-group">
          {step > 1 && step < 7 && (
            <button className="btn-secondary" onClick={prevStep}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Voltar
            </button>
          )}
          {step < 7 && (
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
