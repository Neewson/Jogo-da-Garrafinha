import React from "react";
import { X, Shield, FileText, Info, Mail } from "lucide-react";

interface InfoPagesProps {
  activeTab: "privacy" | "terms" | "about" | "contact" | null;
  onClose: () => void;
  onNavigate: (tab: "privacy" | "terms" | "about" | "contact") => void;
}

export default function InfoPages({ activeTab, onClose, onNavigate }: InfoPagesProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("feedback");
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("https://formsubmit.co/ajax/jogodagarrafinha@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          Nome: name,
          Email: email,
          Assunto: subject,
          Mensagem: message,
          _subject: `Contato Jogo da Garrafinha: ${subject}`
        })
      });

      if (response.ok) {
        setSubmitStatus("success");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Erro ao enviar email", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeTab) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto" id="adsense-pages-overlay">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 sticky top-0 backdrop-blur-md z-15">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-indigo-505/10 rounded-xl text-indigo-400">
              {activeTab === "privacy" && <Shield className="w-5 h-5 col-indigo-400" />}
              {activeTab === "terms" && <FileText className="w-5 h-5 col-indigo-400" />}
              {activeTab === "about" && <Info className="w-5 h-5 col-indigo-400" />}
              {activeTab === "contact" && <Mail className="w-5 h-5 col-indigo-400" />}
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                {activeTab === "privacy" && "Política de Privacidade"}
                {activeTab === "terms" && "Termos de Uso"}
                {activeTab === "about" && "Sobre o Jogo"}
                {activeTab === "contact" && "Contato e Suporte"}
              </h2>
              <p className="text-[10px] text-slate-400">Canal Oficial do Jogo da Garrafinha</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1 px-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1"
            id="close-info-pages"
          >
            <X className="w-4 h-4" />
            <span>Fechar</span>
          </button>
        </div>

        {/* Tab Switcher Headers for quick access */}
        <div className="flex border-b border-slate-800/80 bg-slate-950/40 p-1 sm:p-2 sm:gap-1.5 overflow-x-auto text-[11px] sm:text-xs">
          <button
            onClick={() => onNavigate("privacy")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all font-bold shrink-0 cursor-pointer ${
              activeTab === "privacy" 
                ? "bg-slate-800 text-indigo-400 border border-slate-700/60" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Políticas de Privacidade
          </button>
          <button
            onClick={() => onNavigate("terms")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all font-bold shrink-0 cursor-pointer ${
              activeTab === "terms" 
                ? "bg-slate-800 text-indigo-400 border border-slate-700/60" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Termos de Uso
          </button>
          <button
            onClick={() => onNavigate("about")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all font-bold shrink-0 cursor-pointer ${
              activeTab === "about" 
                ? "bg-slate-800 text-indigo-400 border border-slate-700/60" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sobre o Simulador
          </button>
          <button
            onClick={() => onNavigate("contact")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all font-bold shrink-0 cursor-pointer ${
              activeTab === "contact" 
                ? "bg-slate-800 text-indigo-400 border border-slate-700/60" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Contato
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed" id="info-modal-scrollable-body">
          {activeTab === "privacy" && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-extrabold text-white">Política de Privacidade</h3>
              <p className="text-[11px] text-indigo-400">Última atualização: Junho 2026</p>
              
              <p>
                A sua privacidade é de extrema importância para nós. É política do <strong>Jogo da Garrafinha</strong> respeitar a sua privacidade em relação a qualquer informação que possamos coletar no site Jogo da Garrafinha e outros sites que possuímos e operamos.
              </p>

              <h4 className="text-white font-bold leading-none mt-4 flex items-center gap-1.5 text-xs sm:text-sm uppercase tracking-wider text-indigo-300">
                <span>1. Coleta de Informações</span>
              </h4>
              <p>
                Solicitamos informações pessoais (como nome, email ou recordes de conquistas) apenas quando realmente as necessitamos para fornecer um serviço de ranking, salvar suas configurações personalizadas de peso e quantidade de água, ou permitir o resgate de conquistas do jogador. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento.
              </p>
              
              <h4 className="text-white font-bold leading-none mt-4 flex items-center gap-1.5 text-xs sm:text-sm uppercase tracking-wider text-indigo-300">
                <span>2. Compartilhamento de dados com Publicidade (Google AdSense)</span>
              </h4>
              <p>
                Este site pode utilizar o <strong>Google AdSense</strong> para veicular anúncios publicitários personalizados de forma a financiar este simulador de física gratuito. O Google usa cookies para veicular anúncios com base em visitas anteriores feitas por usuários ao nosso ou a outros sites na internet.
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1.5">
                <li>O Google utiliza cookies do <strong>DoubleClick DART</strong> para exibir anúncios de acordo com o padrão do usuário.</li>
                <li>Você pode desativar o uso do cookie DART visitando a Política de privacidade da rede de conteúdo e anúncios do Google.</li>
                <li>Cookies de terceiros também podem ser lidos para segmentação comportamental e otimização de anúncios.</li>
              </ul>

              <h4 className="text-white font-bold leading-none mt-4 flex items-center gap-1.5 text-xs sm:text-sm uppercase tracking-wider text-indigo-300">
                <span>3. Armazenamento Local (LocalStorage)</span>
              </h4>
              <p>
                Para uma melhor experiência offline e sem travamentos, salvamos suas recordes e preferências preferidas (como o volume de água customizado, nível da gravidade, sensibilidade de rotação e histórico de arremessos) diretamente no armazenamento local do seu próprio navegador (LocalStorage). Estes dados residem apenas em seu dispositivo e podem ser inteiramente deletados clicando em "Zerar Conquistas e Recordes" a qualquer momento.
              </p>

              <h4 className="text-white font-bold leading-none mt-4 flex items-center gap-1.5 text-xs sm:text-sm uppercase tracking-wider text-indigo-300">
                <span>4. Segurança de Dados</span>
              </h4>
              <p>
                Nossos canais de comunicação com serviços externos são criptografados de ponta a ponta via protocolos TLS/HTTPS de alto desempenho, resguardando quaisquer informações enviadas aos nossos formulários ou servidores contra perdas, roubos e interceptações.
              </p>

              <h4 className="text-white font-bold leading-none mt-4 flex items-center gap-1.5 text-xs sm:text-sm uppercase tracking-wider text-indigo-300">
                <span>5. Contato sobre Privacidade</span>
              </h4>
              <p>
                Se você tiver perguntas sobre como tratamos dados de usuários e informações pessoais, entre em contato conosco através da aba de Suporte.
              </p>
            </div>
          )}

          {activeTab === "terms" && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-extrabold text-white">Termos de Uso</h3>
              <p className="text-[11px] text-indigo-400">Última atualização: Junho 2026</p>

              <h4 className="text-white font-bold leading-none mt-4 text-xs sm:text-sm uppercase tracking-wider text-indigo-300">1. Aceitação do Termo</h4>
              <p>
                Ao acessar e simular no Jogo da Garrafinha, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site.
              </p>

              <h4 className="text-white font-bold leading-none mt-4 text-xs sm:text-sm uppercase tracking-wider text-indigo-300">2. Licença de Uso do Simulador</h4>
              <p>
                É concedida permissão para renderizar e jogar temporariamente este simulador científico via navegadores modernos de internet. Esta é a concessão de uma licença temporária e não comercial de entretenimento, e sob esta licença você não pode:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1.5">
                <li>Modificar ou copiar os algoritmos matemáticos proprietários de física rígida 2D da garrafa;</li>
                <li>Mapear indevidamente APIs do jogo para injetar bots ou placares falsos;</li>
                <li>Remover quaisquer direitos autorais ou outras notações de propriedade dos materiais; ou</li>
                <li>Transferir o código-fonte proprietário do jogo nos servidores de hospedagem originais sem permissão escrita.</li>
              </ul>

              <h4 className="text-white font-bold leading-none mt-4 text-xs sm:text-sm uppercase tracking-wider text-indigo-300">3. Isenção de Responsabilidade</h4>
              <p>
                Os materiais no site do Jogo da Garrafinha são fornecidos "como estão". Jogo da Garrafinha não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos.
              </p>

              <h4 className="text-white font-bold leading-none mt-4 text-xs sm:text-sm uppercase tracking-wider text-indigo-300">4. Limitações sobre Prática e Apostas</h4>
              <p>
                Este site é exclusivamente um simulador lúdico e matemático gratuito para fins de entretenimento e física recreativa. Não gerenciamos apostas reais em dinheiro e as estatísticas do jogo são meramente pontuações virtuais. Qualquer referência e adaptação para fins promocionais deve respeitar integralmente a legislação vigente.
              </p>
            </div>
          )}

          {activeTab === "about" && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-extrabold text-white">Sobre o Jogo</h3>
              <p className="text-[11px] text-indigo-400">Entretenimento Matemático & Física Realista</p>
              
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-3">
                <p>
                  O <strong>Jogo da Garrafinha</strong> é uma recriação matemática ultra fiel do desafio viral do YouTube e das redes de conseguir rotacionar a garrafa plástica com água de modo que caia e permaneça em pé.
                </p>
                <p>
                  Diferente de imitadores simples, este motor simula a <strong>Dinâmica de Corpo Rígido 2D</strong> com fricção contínua de contato com o chão, coeficiente de amortecimento de colisões e o deslocamento do <strong>Centro de Massa</strong> com base no volume de água presente no recipiente!
                </p>
              </div>

              <h4 className="text-white font-bold leading-none mt-4 text-xs sm:text-sm uppercase tracking-wider text-indigo-300">Principais Recursos Avançados</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <span className="font-bold text-indigo-300 block mb-1">💦 Fluido Dinâmico</span>
                  <p className="text-xs text-slate-400">Escolha a quantidade de água exata dentro de cada garrafa para ver como o peso influencia o movimento rotacional.</p>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <span className="font-bold text-sky-300 block mb-1">👑 Equilíbrio Lendário</span>
                  <p className="text-xs text-slate-400">Pousar de pé gera pontuações normais, mas equilibrá-la perfeitamente na tampa confere bônus de física avançada!</p>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <span className="font-bold text-purple-300 block mb-1">🌆 Cenários & Efeitos</span>
                  <p className="text-xs text-slate-400">Altere o plano de fundo, coeficiente de gravidade, gravidade do vento e resistência física diretamente no painel.</p>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <span className="font-bold text-emerald-300 block mb-1">🏆 Sistema de Conquistas</span>
                  <p className="text-xs text-slate-400">Recordes de lançamentos perfeitos, saltos insanos, pousos seguidos e desbloqueio de novas garrafinhas exclusivas.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-extrabold text-white">Contato e Suporte</h3>
              <p className="text-[11px] text-indigo-400">Tem dúvidas, sugestões ou parcerias comerciais?</p>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-indigo-500/10 space-y-3">
                <p>
                  Nossa equipe técnica e comercial está sempre à disposição para ouvir sugestões de novas garrafas, ideias de cenários, problemas técnicos com o simulador ou propostas para inserção de campanhas de anúncios diretas.
                </p>
                <div className="flex items-center space-x-2.5 text-indigo-300 font-mono text-xs mt-2 bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <span>Email de Contato: <strong>jogodagarrafinha@gmail.com</strong></span>
                </div>
              </div>

              {/* Formulário de contato dinâmico real integrado via FormSubmit.co */}
              <div className="bg-slate-900/60 p-4 sm:p-5 rounded-xl border border-slate-800 mt-4 space-y-3">
                <span className="block font-bold text-white text-xs sm:text-sm">Envie uma mensagem direta</span>
                <form 
                  onSubmit={handleSubmit}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Nome Completo</label>
                      <input 
                        type="text" 
                        required 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Nilson Camargo" 
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Endereço de Email</label>
                      <input 
                        type="email" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ex: nilson@gmail.com" 
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Assunto / Tipo de Solicitação</label>
                    <select 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Feedback">Enviar Feedback & Sugestões de Recursos</option>
                      <option value="Suporte do Jogo">Reportar Bug / Problema com Física</option>
                      <option value="Anúncios e Negócios">Proposta de Anúncio / Negócios</option>
                      <option value="Privacidade e Ads">Dúvidas sobre Privacidade (Google Ads)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold mb-1">Sua Mensagem</label>
                    <textarea 
                      required 
                      rows={3} 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escreva sua mensagem detalhadamente aqui..." 
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500" 
                    />
                  </div>

                  {submitStatus === "success" && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-[11px] font-semibold">
                      ✨ Sua mensagem foi enviada com sucesso! Ela chegará diretamente em <strong>jogodagarrafinha@gmail.com</strong>. Obrigado!
                    </div>
                  )}

                  {submitStatus === "error" && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-450 text-[11px] font-semibold">
                      ❌ Ocorreu um problema ao enviar. Por favor, envie diretamente para <strong>jogodagarrafinha@gmail.com</strong>.
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="py-2 px-4 bg-indigo-600 hover:bg-indigo-550 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <span>Enviar Mensagem</span>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer Section of page */}
        <div className="p-3 bg-slate-950 border-t border-slate-850/60 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 px-5 sm:px-8">
          <span>© 2026 Jogo da Garrafinha Oficial • Todos os direitos reservados.</span>
          <div className="flex gap-3 text-slate-400">
            <button onClick={() => onNavigate("privacy")} className="hover:text-indigo-400 transition-all cursor-pointer">Privacidade</button>
            <span>•</span>
            <button onClick={() => onNavigate("terms")} className="hover:text-indigo-400 transition-all cursor-pointer">Termos</button>
            <span>•</span>
            <button onClick={() => onNavigate("about")} className="hover:text-indigo-400 transition-all cursor-pointer">Sobre</button>
            <span>•</span>
            <button onClick={() => onNavigate("contact")} className="hover:text-indigo-400 transition-all cursor-pointer">Contato</button>
          </div>
        </div>

      </div>
    </div>
  );
}
