export default class jogadorSheet extends ActorSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "systems/cinzas-no-paraiso-das-laminas/templates/sheets/personagem-sheet.hbs",
            classes: ["cinzas-no-paraiso-das-laminas", "sheet"],
            
        });
    }

    async getData(options) {
        const context = await super.getData(options);
        const activeTab = this._activeTab || "ficha-personagem";
        context.showFichaPersonagem = activeTab === "ficha-personagem";
        context.showFichaMestica = activeTab === "ficha-mestica";
        context.showFichaAlteracoes = activeTab === "ficha-alteracoes";
        context.showDemaisInformacoes = activeTab === "ficha-demais-informacoes";
        // Imagem padrão da Mestiça quando não houver img definida (pode trocar por qualquer caminho)
        context.imgMesticaDefault = "icons/svg/mystery-man.svg";
        try {
            const res = await fetch("systems/cinzas-no-paraiso-das-laminas/template.json");
            if (res.ok) {
                const tpl = await res.json();
                if (tpl && tpl.Actor && tpl.Actor.templates) {
                    // Merge template defaults into actor.system
                    context.actor.system = foundry.utils.mergeObject(
                        structuredClone(tpl.Actor.templates),
                        context.actor.system || {}
                    );
                }
            } else console.warn("Could not load template.json", res.status);
        } catch (err) {
            console.warn("Error loading template.json", err);
        }
        // Valores para a aba Alterações (chaves com hífen no status)
        const resistPasObj = context.actor?.system?.status?.["resist-pas"];
        const percepPasObj = context.actor?.system?.status?.["percep-pas"];
        const esquivaPasObj = context.actor?.system?.status?.["esquiva-pas"];
        context.altResistPas = (typeof resistPasObj === "object" ? resistPasObj?.value : resistPasObj) ?? 0;
        context.altResistPasPositivo = (typeof resistPasObj === "object" ? resistPasObj?.positivo : 0) ?? 0;
        context.altResistPasNegativo = (typeof resistPasObj === "object" ? resistPasObj?.negativo : 0) ?? 0;
        context.altPercepPas = (typeof percepPasObj === "object" ? percepPasObj?.value : percepPasObj) ?? 5;
        context.altPercepPasPositivo = (typeof percepPasObj === "object" ? percepPasObj?.positivo : 0) ?? 0;
        context.altPercepPasNegativo = (typeof percepPasObj === "object" ? percepPasObj?.negativo : 0) ?? 0;
        context.altEsquivaPas = (typeof esquivaPasObj === "object" ? esquivaPasObj?.value : esquivaPasObj) ?? 0;
        context.altEsquivaPasPositivo = (typeof esquivaPasObj === "object" ? esquivaPasObj?.positivo : 0) ?? 0;
        context.altEsquivaPasNegativo = (typeof esquivaPasObj === "object" ? esquivaPasObj?.negativo : 0) ?? 0;
        // Valores para cores personalizadas
        context.corNav = context.actor?.system?.aparencia?.corNav ?? "#842121";
        context.corFundo = context.actor?.system?.aparencia?.corFundo ?? "#A02727";
        context.corTexto = context.actor?.system?.aparencia?.corTexto ?? "#ffffff";
        context.corTextoInput = context.actor?.system?.aparencia?.corTextoInput ?? "#000000";
        context.corFundoInput = context.actor?.system?.aparencia?.corFundoInput ?? "#c1bfbf";
        context.corBtnHover = context.actor?.system?.aparencia?.corBtnHover ?? "#b75454";
        context.corBtn = context.actor?.system?.aparencia?.corBtn ?? "#842121";
        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        this.fichaMestica(html);
        this.fichaPersonagem(html);
        this.fichaAlteracoes(html);
        this.fichaDemaisInformacoes(html);
        this.setupGeasReveal(html);
        this.setupCorNavListener(html);
        this.setupAutoSave(html);
        this.setupZerarPositivoNegativo(html);
        this.initQuillEditors(html);

        // Botão btn-dano: zera total e porcentagem de dano (UI + dados do ator)
        html.find("#btn-dano").on("click", () => {
            this._restoreFocusId = document.activeElement?.id || null;
            html.find("#input-dano-total").val(0);
            html.find("#input-dano-porcentagem").val(0);
            this.actor.update({
                "system.combate.dano.total": 0,
                "system.combate.dano.porcentagem": 0,
                "system.combate.dano.recebido": 0
            });
        });

        // Botão para zerar canalização da Mestiça
        html.find("#zera-canalizacao").on("click", () => {
            this._restoreFocusId = document.activeElement?.id || null;
            this.actor.update({
                "system.mestica.canalizacao.value": 0,
                "system.mestica.canalizacao.usa": 0
            });
        });

        // Botão para resetar estilo
        html.find("#btn-resetar-estilo").on("click", () => {
            const defaultCorNav = "#842121";
            const defaultCorFundo = "#A02727";
            const defaultCorTexto = "#ffffff";
            const defaultCorFundoInput = "#c1bfbf";
            const defaultCorTextoInput = "#000000";
            const defaultCorBtnHover = "#b75454";
            const defaultCorBtn = "#842121";
            this.actor.update({
                "system.aparencia.corNav": defaultCorNav,
                "system.aparencia.corFundo": defaultCorFundo,
                "system.aparencia.corTexto": defaultCorTexto,
                "system.aparencia.corFundoInput": defaultCorFundoInput,
                "system.aparencia.corTextoInput": defaultCorTextoInput,
                "system.aparencia.corBtnHover": defaultCorBtnHover,
                "system.aparencia.corBtn": defaultCorBtn
            });
            // Atualizar CSS variables imediatamente
            const windowContent = html.closest(".window-content")[0];
            if (windowContent) {
                windowContent.style.setProperty("--cor-nav", defaultCorNav);
                windowContent.style.setProperty("--cor-fundo", defaultCorFundo);
                windowContent.style.setProperty("--cor-texto", defaultCorTexto);
                windowContent.style.setProperty("--cor-fundo-input", defaultCorFundoInput);
                windowContent.style.setProperty("--cor-texto-input", defaultCorTextoInput);
                windowContent.style.setProperty("--cor-btn-hover", defaultCorBtnHover);
                windowContent.style.setProperty("--cor-btn", defaultCorBtn);
            }
            // Atualizar valores dos inputs
            html.find("#cor-nav").val(defaultCorNav);
            html.find("#cor-fundo").val(defaultCorFundo);
            html.find("#cor-texto").val(defaultCorTexto);
            html.find("#cor-fundo-input").val(defaultCorFundoInput);
            html.find("#cor-texto-input").val(defaultCorTextoInput);
            html.find("#cor-btn-hover").val(defaultCorBtnHover);
            html.find("#cor-btn").val(defaultCorBtn);
        });

        // Botões para selecionar estilos predefinidos
        for (let i = 1; i <= 6; i++) {
            html.find(`#btn-selecionar-estilo${i}`).on("click", (event) => {
                const button = $(event.target);
                const parentDiv = button.closest(".estilos-predefinidos");
                const corNav = parentDiv.data("cor-nav");
                const corFundo = parentDiv.data("cor-fundo");
                const corTexto = parentDiv.data("cor-texto");
                const corBtn = parentDiv.data("cor-btn");
                const corBtnHover = parentDiv.data("cor-btn-hover");
                const corFundoInput = parentDiv.data("cor-fundo-input");
                const corTextoInput = parentDiv.data("cor-texto-input");
                this.actor.update({
                    "system.aparencia.corNav": corNav,
                    "system.aparencia.corFundo": corFundo,
                    "system.aparencia.corTexto": corTexto,
                    "system.aparencia.corBtn": corBtn,
                    "system.aparencia.corBtnHover": corBtnHover,
                    "system.aparencia.corFundoInput": corFundoInput,
                    "system.aparencia.corTextoInput": corTextoInput
                });
                // Atualizar CSS variables imediatamente
                const windowContent = html.closest(".window-content")[0];
                if (windowContent) {
                    windowContent.style.setProperty("--cor-nav", corNav);
                    windowContent.style.setProperty("--cor-fundo", corFundo);
                    windowContent.style.setProperty("--cor-texto", corTexto);
                    windowContent.style.setProperty("--cor-btn", corBtn);
                    windowContent.style.setProperty("--cor-btn-hover", corBtnHover);
                    windowContent.style.setProperty("--cor-fundo-input", corFundoInput);
                    windowContent.style.setProperty("--cor-texto-input", corTextoInput);
                }
                // Atualizar valores dos inputs personalizados
                html.find("#cor-nav").val(corNav);
                html.find("#cor-fundo").val(corFundo);
                html.find("#cor-texto").val(corTexto);
                html.find("#cor-btn").val(corBtn);
                html.find("#cor-btn-hover").val(corBtnHover);
                html.find("#cor-fundo-input").val(corFundoInput);
                html.find("#cor-texto-input").val(corTextoInput);
            });
        }
    }

    setupCorNavListener(html) {
        const corNavInput = html.find("#cor-nav");
        const corFundoFicha = html.find("#cor-fundo");
        const corTextoFicha = html.find("#cor-texto");
        const corFundoInputFicha = html.find("#cor-fundo-input");
        const corTextoInputFicha = html.find("#cor-texto-input");
        const corBtnHoverFicha = html.find("#cor-btn-hover");
        const corBtnFicha = html.find("#cor-btn");
        const windowContent = html.closest(".window-content")[0];
        
        // Aplicar cores iniciais do actor
        const corNav = this.actor.system?.aparencia?.corNav ?? "#842121";
        const corFundo = this.actor.system?.aparencia?.corFundo ?? "#A02727";
        const corTexto = this.actor.system?.aparencia?.corTexto ?? "#ffffff";
        const corFundoInput = this.actor.system?.aparencia?.corFundoInput ?? "#c1bfbf";
        const corTextoInput = this.actor.system?.aparencia?.corTextoInput ?? "#000000";
        const corBtnHover = this.actor.system?.aparencia?.corBtnHover ?? "#b75454";
        const corBtn = this.actor.system?.aparencia?.corBtn ?? "#842121";

        // Usar setProperty para aplicar CSS variables de forma mais robusta
        if (windowContent) {
            windowContent.style.setProperty("--cor-nav", corNav);
            windowContent.style.setProperty("--cor-fundo", corFundo);
            windowContent.style.setProperty("--cor-texto", corTexto);
            windowContent.style.setProperty("--cor-fundo-input", corFundoInput);
            windowContent.style.setProperty("--cor-texto-input", corTextoInput);
            windowContent.style.setProperty("--cor-btn-hover", corBtnHover);
            windowContent.style.setProperty("--cor-btn", corBtn);
        }
        
        // Listener para mudança de cor na navegação
        corNavInput.on("change", (event) => {
            const novaCor = $(event.target).val();
            if (novaCor && windowContent) {
                windowContent.style.setProperty("--cor-nav", novaCor);
                this.actor.update({ "system.aparencia.corNav": novaCor });
            }
        });
        
        // Listener para mudança de cor no fundo
        corFundoFicha.on("change", (event) => {
            const novaCor = $(event.target).val();
            if (novaCor && windowContent) {
                windowContent.style.setProperty("--cor-fundo", novaCor);
                this.actor.update({ "system.aparencia.corFundo": novaCor });
            }
        });
        
        // Listener para mudança de cor do texto
        corTextoFicha.on("change", (event) => {
            const novaCor = $(event.target).val();
            if (novaCor && windowContent) {
                windowContent.style.setProperty("--cor-texto", novaCor);
                this.actor.update({ "system.aparencia.corTexto": novaCor });
            }
        });

        corFundoInputFicha.on("change", (event) => {
            const novaCor = $(event.target).val();
            if (novaCor && windowContent) {
                windowContent.style.setProperty("--cor-fundo-input", novaCor);
                this.actor.update({ "system.aparencia.corFundoInput": novaCor });
            }
        });

        corTextoInputFicha.on("change", (event) => {
            const novaCor = $(event.target).val();
            if (novaCor && windowContent) {
                windowContent.style.setProperty("--cor-texto-input", novaCor);
                this.actor.update({ "system.aparencia.corTextoInput": novaCor });
            }
        });

        corBtnHoverFicha.on("change", (event) => {
            const novaCor = $(event.target).val();
            if (novaCor && windowContent) {
                windowContent.style.setProperty("--cor-btn-hover", novaCor);
                this.actor.update({ "system.aparencia.corBtnHover": novaCor });
            }
        });

        corBtnFicha.on("change", (event) => {
            const novaCor = $(event.target).val();
            if (novaCor && windowContent) {
                windowContent.style.setProperty("--cor-btn", novaCor);
                this.actor.update({ "system.aparencia.corBtn": novaCor });
            }
        });

        // Aplicar cor em tempo real enquanto o usuário seleciona (evento input)
        corNavInput.on("input", (event) => {
            const novaCor = $(event.target).val();
            if (novaCor && windowContent) {
                windowContent.style.setProperty("--cor-nav", novaCor);
            }
        });
        
        corFundoFicha.on("input", (event) => {
            const novaCor = $(event.target).val();
            if (novaCor && windowContent) {
                windowContent.style.setProperty("--cor-fundo", novaCor);
            }
        });
        
        corTextoFicha.on("input", (event) => {
            const novaCor = $(event.target).val();
            if (novaCor && windowContent) {
                windowContent.style.setProperty("--cor-texto", novaCor);
            }
        });

        corFundoInputFicha.on("input", (event) => {
            const novaCor = $(event.target).val();
            if (novaCor && windowContent) {
                windowContent.style.setProperty("--cor-fundo-input", novaCor);
            }
        });

        corTextoInputFicha.on("input", (event) => {
            const novaCor = $(event.target).val();
            if (novaCor && windowContent) {
                windowContent.style.setProperty("--cor-texto-input", novaCor);
            }
        });

        corBtnHoverFicha.on("input", (event) => {
            const novaCor = $(event.target).val();
            if (novaCor && windowContent) {
                windowContent.style.setProperty("--cor-btn-hover", novaCor);
            }
        });

        corBtnFicha.on("input", (event) => {
            const novaCor = $(event.target).val();
            if (novaCor && windowContent) {
                windowContent.style.setProperty("--cor-btn", novaCor);
            }
        });
    }

    setupGeasReveal(html) {
        const inputGeas = html.find("#input-geas");
        inputGeas.on("focus", () => inputGeas.attr("type", "text"));
        inputGeas.on("blur", () => inputGeas.attr("type", "password"));
    }

    setupZerarPositivoNegativo(html) {
        const statusResources = ["vida", "estamina", "psique"];
        statusResources.forEach(name => {
            html.find(`#btn-${name}-positivo-zerar`).on("click", () => {
                this._restoreFocusId = document.activeElement?.id || null;
                const s = this.actor.system?.status?.[name];
                const max = s?.max ?? 0;
                const pos = s?.positivo ?? 0;
                if (pos === 0) return;
                this.actor.update({
                    [`system.status.${name}.max`]: Math.max(0, max - pos),
                    [`system.status.${name}.positivo`]: 0
                });
            });
            html.find(`#btn-${name}-negativo-zerar`).on("click", () => {
                this._restoreFocusId = document.activeElement?.id || null;
                const s = this.actor.system?.status?.[name];
                const max = s?.max ?? 0;
                const neg = s?.negativo ?? 0;
                if (neg === 0) return;
                this.actor.update({
                    [`system.status.${name}.max`]: max + neg,
                    [`system.status.${name}.negativo`]: 0
                });
            });
        });
        const mesticaResources = ["energia", "canalizacao"];
        mesticaResources.forEach(name => {
            html.find(`#btn-${name}-positivo-zerar`).on("click", () => {
                this._restoreFocusId = document.activeElement?.id || null;
                const s = this.actor.system?.mestica?.[name];
                const max = s?.max ?? 0;
                const pos = s?.positivo ?? 0;
                if (pos === 0) return;
                this.actor.update({
                    [`system.mestica.${name}.max`]: Math.max(0, max - pos),
                    [`system.mestica.${name}.positivo`]: 0
                });
            });
            html.find(`#btn-${name}-negativo-zerar`).on("click", () => {
                this._restoreFocusId = document.activeElement?.id || null;
                const s = this.actor.system?.mestica?.[name];
                const max = s?.max ?? 0;
                const neg = s?.negativo ?? 0;
                if (neg === 0) return;
                this.actor.update({
                    [`system.mestica.${name}.max`]: max + neg,
                    [`system.mestica.${name}.negativo`]: 0
                });
            });
        });
        const passivas = ["resist-pas", "percep-pas", "esquiva-pas"];
        passivas.forEach(name => {
            const path = `system.status.${name}`;
            html.find(`#btn-${name}-positivo-zerar`).on("click", () => {
                this._restoreFocusId = document.activeElement?.id || null;
                const obj = this.actor.system?.status?.[name];
                const val = typeof obj === "object" ? (obj?.value ?? 0) : (obj ?? 0);
                const pos = typeof obj === "object" ? (obj?.positivo ?? 0) : 0;
                if (pos === 0) return;
                this.actor.update({
                    [`${path}.value`]: val - pos,
                    [`${path}.positivo`]: 0
                });
            });
            html.find(`#btn-${name}-negativo-zerar`).on("click", () => {
                this._restoreFocusId = document.activeElement?.id || null;
                const obj = this.actor.system?.status?.[name];
                const val = typeof obj === "object" ? (obj?.value ?? 0) : (obj ?? 0);
                const neg = typeof obj === "object" ? (obj?.negativo ?? 0) : 0;
                if (neg === 0) return;
                this.actor.update({
                    [`${path}.value`]: val + neg,
                    [`${path}.negativo`]: 0
                });
            });
        });
        const atributos = ["forca", "constituicao", "destreza", "mobilidade", "mente", "moral"];
        atributos.forEach(name => {
            html.find(`#btn-${name}-positivo-zerar`).on("click", () => {
                this._restoreFocusId = document.activeElement?.id || null;
                const a = this.actor.system?.atributos?.[name];
                const dados = a?.dados ?? 1;
                const pos = a?.positivo ?? 0;
                if (pos === 0) return;
                this.actor.update({
                    [`system.atributos.${name}.dados`]: Math.max(0, dados - pos),
                    [`system.atributos.${name}.positivo`]: 0
                });
            });
            html.find(`#btn-${name}-negativo-zerar`).on("click", () => {
                this._restoreFocusId = document.activeElement?.id || null;
                const a = this.actor.system?.atributos?.[name];
                const dados = a?.dados ?? 1;
                const neg = a?.negativo ?? 0;
                if (neg === 0) return;
                this.actor.update({
                    [`system.atributos.${name}.dados`]: dados + neg,
                    [`system.atributos.${name}.negativo`]: 0
                });
            });
        });
    }

    // SHOW/HIDE DE ABAS
    fichaPersonagem(html) {
        html.find("#ficha-personagem").click(() => {
            this._activeTab = "ficha-personagem";
            html.find(".ficha-personagem").show();
            html.find(".ficha-mestica").hide();
            html.find(".ficha-alteracoes").hide();
            html.find(".ficha-demais-informacoes").hide();
        });
    }
    fichaMestica(html) {
        html.find("#ficha-mestica").click(() => {
            this._activeTab = "ficha-mestica";
            html.find(".ficha-personagem").hide();
            html.find(".ficha-mestica").show();
            html.find(".ficha-alteracoes").hide();
            html.find(".ficha-demais-informacoes").hide();
        });
    }
    fichaAlteracoes(html) {
        html.find("#ficha-alteracoes").click(() => {
            this._activeTab = "ficha-alteracoes";
            html.find(".ficha-personagem").hide();
            html.find(".ficha-mestica").hide();
            html.find(".ficha-alteracoes").show();
            html.find(".ficha-demais-informacoes").hide();
        });
    }
    fichaDemaisInformacoes(html) {
        html.find("#ficha-demais-informacoes").click(() => {
            this._activeTab = "ficha-demais-informacoes";
            html.find(".ficha-personagem").hide();
            html.find(".ficha-mestica").hide();
            html.find(".ficha-alteracoes").hide();
            html.find(".ficha-demais-informacoes").show();
        });
    }

    initQuillEditors(html) {
        // Carregar Quill dinamicamente se não estiver já carregado
        if (typeof Quill === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/quill@1.3.6/dist/quill.js';
            script.onload = () => this.initializeQuillInstances(html);
            document.head.appendChild(script);

            // Adicionar CSS do Quill
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/quill@1.3.6/dist/quill.core.css';
            document.head.appendChild(link);

            const linkSnow = document.createElement('link');
            linkSnow.rel = 'stylesheet';
            linkSnow.href = 'https://cdn.jsdelivr.net/npm/quill@1.3.6/dist/quill.snow.css';
            document.head.appendChild(linkSnow);
        } else {
            this.initializeQuillInstances(html);
        }
    }

    initializeQuillInstances(html) {
        const quillOptions = {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['bold', 'italic', 'underline'],
                    ['link', 'image'],
                    [{ 'align': [] }],
                    ['clean']
                ]
            }
        };

        const editors = [
            { selector: '#peculiariedades', field: 'system.mestica.peculiaridades' },
            { selector: '#tecnicas', field: 'system.mestica.tecnicas' },
            { selector: '#inventario', field: 'system.inventario' },
            { selector: '#text-ate-aonde-iria', field: 'system.demais-informacoes.ate-aonde-iria' },
            { selector: '#text-nascimento-mestica', field: 'system.demais-informacoes.nascimento-mestica' },
            { selector: '#text-anotacoes', field: 'system.demais-informacoes.anotacoes' }
        ];

        for (const editor of editors) {
            const container = html.find(editor.selector);
            if (!container.length) continue;

            const quill = new Quill(container[0], quillOptions);

            let initialContent = '';
            if (editor.field === 'system.mestica.peculiaridades') {
                initialContent = this.actor.system.mestica?.peculiaridades || '';
            } else if (editor.field === 'system.mestica.tecnicas') {
                initialContent = this.actor.system.mestica?.tecnicas || '';
            } else if (editor.field === 'system.inventario') {
                initialContent = this.actor.system.inventario || '';
            } else if (editor.field === 'system.demais-informacoes.ate-aonde-iria') {
                initialContent = this.actor.system['demais-informacoes']?.['ate-aonde-iria'] || '';
            } else if (editor.field === 'system.demais-informacoes.nascimento-mestica') {
                initialContent = this.actor.system['demais-informacoes']?.['nascimento-mestica'] || '';
            } else if (editor.field === 'system.demais-informacoes.anotacoes') {
                initialContent = this.actor.system['demais-informacoes']?.anotacoes || '';
            }

            if (initialContent) {
                quill.root.innerHTML = initialContent;
            }

            let debounceTimer = null;
            quill.on('text-change', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const content = quill.root.innerHTML;
                    this.actor.update({ [editor.field]: content });
                }, 1000);
            });
        }
    }

    // ========== HELPER FUNCTIONS PARA CÁLCULOS REPETIDOS ==========
    calculateResistenciaPas(forcaValue = null, constituicaoValue = null, resistForca = null, resistConstituicao = null) {
        const resistPadrao = 5;
        resistForca = resistForca ?? (this.actor.system.proeficiencias?.forca?.primeiro?.ativo || false);
        resistConstituicao = resistConstituicao ?? (this.actor.system.proeficiencias?.constituicao?.primeiro?.ativo || false);
        const positivo = this.actor.system.status?.["resist-pas"]?.positivo || 0;
        const negativo = this.actor.system.status?.["resist-pas"]?.negativo || 0;
        
        forcaValue = forcaValue ?? (this.actor.system.atributos.forca.value || 0);
        constituicaoValue = constituicaoValue ?? (this.actor.system.atributos.constituicao.value || 0);
        
        let resistPas = resistPadrao;
        if (resistForca && resistConstituicao) {
            resistPas = resistPadrao + (Math.trunc(forcaValue / 2)) + ((Math.trunc(constituicaoValue / 2) * 2));
        } else if (resistForca) {
            resistPas = resistPadrao + Math.trunc(forcaValue / 2);
        } else if (resistConstituicao) {
            resistPas = resistPadrao + (Math.trunc(constituicaoValue / 2) * 2);
        } else {
            resistPas = 0;
        }
        return resistPas + positivo - negativo;
    }

    calculatePercepPas(destrezaValue = null, menteValue = null, percepDestreza = null, percepMente = null) {
        const percepPadrao = 5;
        percepDestreza = percepDestreza ?? (this.actor.system.proeficiencias?.destreza?.primeiro?.ativo || false);
        percepMente = percepMente ?? (this.actor.system.proeficiencias?.mente?.terceiro?.ativo || false);
        const positivo = this.actor.system.status?.["percep-pas"]?.positivo || 0;
        const negativo = this.actor.system.status?.["percep-pas"]?.negativo || 0;
        
        destrezaValue = destrezaValue ?? (this.actor.system.atributos.destreza.value || 0);
        menteValue = menteValue ?? (this.actor.system.atributos.mente.value || 0);
        
        let percepPas = percepPadrao;
        if (percepDestreza && percepMente) {
            percepPas = percepPadrao + (Math.trunc(destrezaValue / 2)) + ((Math.trunc(menteValue / 2) * 2));
        } else if (percepDestreza) {
            percepPas = percepPadrao + Math.trunc(destrezaValue / 2);
        } else if (percepMente) {
            percepPas = percepPadrao + (Math.trunc(menteValue / 2) * 2);
        }
        return percepPas + positivo - negativo;
    }

    calculateEsquivaPas(mobilidadeValue = null, esquivaMobilidade = null) {
        const esquivaPadrao = 6;
        esquivaMobilidade = esquivaMobilidade ?? (this.actor.system.proeficiencias?.mobilidade?.primeiro?.ativo || false);
        const positivo = this.actor.system.status?.["esquiva-pas"]?.positivo || 0;
        const negativo = this.actor.system.status?.["esquiva-pas"]?.negativo || 0;
        
        mobilidadeValue = mobilidadeValue ?? (this.actor.system.atributos.mobilidade.value || 0);
        
        let esquivaPas = esquivaPadrao;
        if ((esquivaMobilidade) && (mobilidadeValue % 3 === 0) && (mobilidadeValue >= 6)) {
            esquivaPas = esquivaPadrao + (Math.trunc(mobilidadeValue / 2) * 2);
        } else if (esquivaMobilidade) {
            esquivaPas = esquivaPadrao + Math.trunc(mobilidadeValue / 2);
        } else {
            esquivaPas = 0;
        }
        return esquivaPas + positivo - negativo;
    }

    calculateEstamina(constituicaoValue = null, destrezaValue = null, constituicaoFolego = null, destrezaEquilibrio = null) {
        const estaminaBase = 20;
        constituicaoFolego = constituicaoFolego ?? (this.actor.system.proeficiencias?.constituicao?.segundo?.ativo || false);
        destrezaEquilibrio = destrezaEquilibrio ?? (this.actor.system.proeficiencias?.destreza?.terceiro?.ativo || false);
        
        constituicaoValue = constituicaoValue ?? (this.actor.system.atributos.constituicao.value || 0);
        destrezaValue = destrezaValue ?? (this.actor.system.atributos.destreza.value || 0);
        
        let bonusEstamina = 0;
        if (constituicaoFolego && destrezaEquilibrio) {
            bonusEstamina = (Math.trunc(constituicaoValue / 2) * 10) + (Math.trunc(destrezaValue / 2) * 5);
        } else if (constituicaoFolego) {
            bonusEstamina = Math.trunc(constituicaoValue / 2) * 10;
        } else if (destrezaEquilibrio) {
            bonusEstamina = Math.trunc(destrezaValue / 2) * 5;
        }
        
        const estaminaMax = estaminaBase + bonusEstamina;
        const estaminaPerdida = this.actor.system.status?.estamina?.estaminaPerdida ?? 0;
        const estaminaValue = Math.max(0, estaminaMax - estaminaPerdida);
        
        return { bonus: bonusEstamina, max: estaminaMax, value: estaminaValue };
    }

    calculateVidaMax(constituicaoValue = null, saudeAtiva = null) {
        const vidaPadrao = 100;
        constituicaoValue = constituicaoValue ?? (this.actor.system.atributos.constituicao.value || 0);
        saudeAtiva = saudeAtiva ?? (this.actor.system.proeficiencias?.constituicao?.terceiro?.ativo || false);
        
        let positivo = this.actor.system.status?.vida?.positivo || 0;
        let negativo = this.actor.system.status?.vida?.negativo || 0;

        // Calcula vida máxima base: 100 + (constituição * 10)
        let vidaMax = (vidaPadrao + (constituicaoValue * 10));
        
        // Se proficiência "Saúde" está ativa, dobra a vida máxima
        if (saudeAtiva) {
            vidaMax = vidaMax * 2;
        }

        const metadeVida = vidaMax / 2;
        const energiaMax = this.actor.system.mestica?.energia?.max ?? 0;
        
        vidaMax = vidaMax + positivo - negativo;
        const vidaPerdida = this.actor.system.status?.vida?.vidaPerdida ?? 0;
        const vidaValue = Math.max(0, vidaMax - vidaPerdida);

        return {
            max: vidaMax,
            value: vidaValue,
            energiaMax: metadeVida > energiaMax ? metadeVida : null,
            energiaValue: metadeVida > energiaMax ? Math.max(0, metadeVida) : null
        };
    }
    // ========== FIM HELPER FUNCTIONS ==========

    setupAutoSave(html) {
        // Auto-save on input change
        html.find("input, select, textarea").on("change", (event) => {
            const element = $(event.target);
            const inputId = element.attr("id");
            const isCheckbox = element.attr("type") === "checkbox";
            let value = isCheckbox ? element.is(":checked") : element.val();

            // Verifica se é um checkbox de proficiência
            const isProficienciaCheckbox = element.hasClass("proficiencia-checkbox");
            if (isProficienciaCheckbox) {
                const atributo = element.data("attribute");
                const order = element.data("order");
                const updatePath = `system.proeficiencias.${atributo}.${order}.ativo`;                
                const updateObj = { [updatePath]: value };
                
                // Se for a proficiência "Saúde" de constituição (terceiro)
                if (atributo === 'constituicao' && order === 'terceiro') {
                    const vida = this.calculateVidaMax(null, value);
                    updateObj['system.status.vida.max'] = vida.max;
                    updateObj['system.status.vida.value'] = vida.value;
                    if (vida.energiaMax !== null) {
                        updateObj['system.mestica.energia.max'] = vida.energiaMax;
                        updateObj['system.mestica.energia.value'] = vida.energiaValue;
                    }
                }

                // CALCULO RESISTENCIA
                if ((atributo === "forca" || atributo === "constituicao") && order === 'primeiro') {
                    const forcaRes = atributo === 'forca' ? value : (this.actor.system.proeficiencias?.forca?.primeiro?.ativo || false);
                    const constituicaoRes = atributo === 'constituicao' ? value : (this.actor.system.proeficiencias?.constituicao?.primeiro?.ativo || false);
                    updateObj['system.status.resist-pas.value'] = this.calculateResistenciaPas(null, null, forcaRes, constituicaoRes);
                }

                //CALCULO PERCEPICAO
                if ((atributo === 'destreza' && order === 'primeiro') || (atributo === 'mente' && order === 'terceiro')) {
                    const destrezaPer = atributo === 'destreza' ? value : (this.actor.system.proeficiencias?.destreza?.primeiro?.ativo || false);
                    const mentePer = atributo === 'mente' ? value : (this.actor.system.proeficiencias?.mente?.terceiro?.ativo || false);
                    updateObj['system.status.percep-pas.value'] = this.calculatePercepPas(null, null, destrezaPer, mentePer);
                }

                // CALCULO ESQUIVA
                if (atributo === 'mobilidade' && order === 'primeiro') {
                    const esquivaMobilidade = atributo === 'mobilidade' ? value : (this.actor.system.proeficiencias?.mobilidade?.primeiro?.ativo || false);
                    updateObj['system.status.esquiva-pas.value'] = this.calculateEsquivaPas(null, esquivaMobilidade);
                }

                // CALCULO ESTAMINA (constituição.segundo Fôlego: +10 por bônus | destreza.terceiro Equilíbrio: +5 por bônus)
                if ((atributo === 'constituicao' && order === 'segundo') || (atributo === 'destreza' && order === 'terceiro')) {
                    const constituicaoFolego = atributo === 'constituicao' ? value : (this.actor.system.proeficiencias?.constituicao?.segundo?.ativo || false);
                    const destrezaEquilibrio = atributo === 'destreza' ? value : (this.actor.system.proeficiencias?.destreza?.terceiro?.ativo || false);
                    const est = this.calculateEstamina(null, null, constituicaoFolego, destrezaEquilibrio);
                    updateObj['system.status.estamina.bonus'] = est.bonus;
                    updateObj['system.status.estamina.max'] = est.max;
                    updateObj['system.status.estamina.value'] = est.value;
                }
                
                this.actor.update(updateObj);
                return;
            };

            // Quando o usuário informa dano recebido: soma ao total, guarda em vidaPerdida, calcula % e atualiza vida.value
            if (inputId === "input-dano-recebido") {

                const danoRecebido = parseInt(value, 10) || 0;
                const danoTotalAtual = parseInt(this.actor.system.combate?.dano?.total, 10) || 0;
                const novoTotal = danoTotalAtual + danoRecebido;
                const vidaPerdidaAtual = parseInt(this.actor.system.status?.vida?.vidaPerdida, 10) || 0;
                const novaVidaPerdida = vidaPerdidaAtual + danoRecebido;
                const vidaMax = parseInt(this.actor.system.status?.vida?.max, 10) || 100;
                const vidaAtual = Math.max(0, vidaMax - novaVidaPerdida);
                const porcentagem = vidaMax > 0 ? Math.round((danoRecebido / vidaMax) * 100) : 0;


                this.actor.update({
                    "system.combate.dano.recebido": 0,
                    "system.combate.dano.total": novoTotal,
                    "system.combate.dano.porcentagem": porcentagem,
                    "system.status.vida.vidaPerdida": novaVidaPerdida,
                    "system.status.vida.value": vidaAtual
                });
                element.val(0);
                return;
            }

            // Quando o usuário informa dano de psique: soma ao total, guarda em psiquePerdida e atualiza psique.value
            // mente.primeiro (Resistência): reduz dano de psique em 1 a cada 2 pontos de Mente
            if (inputId === "input-dano-psique") {
                let danoPsique = parseInt(value, 10) || 0;
                const mentePrimeiroAtivo = this.actor.system.proeficiencias?.mente?.primeiro?.ativo || false;
                const menteValue = this.actor.system.atributos?.mente?.value || 0;
                if (mentePrimeiroAtivo) {
                    const reducao = Math.trunc(menteValue / 2);
                    danoPsique = Math.max(0, danoPsique - reducao);
                }
                const psiquePerdidaAtual = this.actor.system.status?.psique?.psiquePerdida ?? 0;
                const novaPsiquePerdida = psiquePerdidaAtual + danoPsique;
                const psiqueMax = this.actor.system.status?.psique?.max ?? 100;
                const psiqueAtual = Math.max(0, psiqueMax - novaPsiquePerdida);

                this.actor.update({
                    "system.combate.dano.psique": 0,
                    "system.status.psique.psiquePerdida": novaPsiquePerdida,
                    "system.status.psique.value": psiqueAtual
                });
                element.val(0);
                return;
            }

            // Quando o usuário informa dano de estamina: soma ao total, guarda em estaminaPerdida e atualiza estamina.value
            if (inputId === "input-dano-estamina") {
                const danoEstamina = parseInt(value, 10) || 0;
                const estaminaPerdidaAtual = this.actor.system.status?.estamina?.estaminaPerdida ?? 0;
                const novaEstaminaPerdida = estaminaPerdidaAtual + danoEstamina;
                const estaminaMax = this.actor.system.status?.estamina?.max ?? 20;
                const estaminaAtual = Math.max(0, estaminaMax - novaEstaminaPerdida);

                this.actor.update({
                    "system.combate.dano.estamina": 0,
                    "system.status.estamina.estaminaPerdida": novaEstaminaPerdida,
                    "system.status.estamina.value": estaminaAtual
                });
                element.val(0);
                return;
            }

            // Quando o usuário informa cura de vida: reduz vidaPerdida e atualiza vida.value (até o máximo)
            if (inputId === "input-cura-vida") {
                const cura = parseInt(value, 10) || 0;
                if (cura > 0) {
                    const vidaPerdidaAtual = parseInt(this.actor.system.status?.vida?.vidaPerdida, 10) || 0;
                    const vidaMax = parseInt(this.actor.system.status?.vida?.max, 10) || 100;
                    const novaVidaPerdida = Math.max(0, vidaPerdidaAtual - cura);
                    const vidaAtual = Math.min(vidaMax, vidaMax - novaVidaPerdida);
                    const danoTotalAtual = parseInt(this.actor.system.combate?.dano?.total, 10) || 0;
                    const novoTotal = Math.max(0, danoTotalAtual - cura);
                    const porcentagem = vidaMax > 0 ? Math.round((novoTotal / vidaMax) * 100) : 0;

                    this.actor.update({
                        "system.combate.recuperacao.vida": 0,
                        "system.combate.dano.total": novoTotal,
                        "system.combate.dano.porcentagem": porcentagem,
                        "system.status.vida.vidaPerdida": novaVidaPerdida,
                        "system.status.vida.value": vidaAtual
                    });
                    element.val(0);
                }
                return;
            }

            // Quando o usuário informa cura de psique: reduz psiquePerdida e atualiza psique.value (até o máximo)
            if (inputId === "input-cura-psique") {
                const cura = parseInt(value, 10) || 0;
                if (cura > 0) {
                    const psiquePerdidaAtual = this.actor.system.status?.psique?.psiquePerdida ?? 0;
                    const psiqueMax = this.actor.system.status?.psique?.max ?? 100;
                    const novaPsiquePerdida = Math.max(0, psiquePerdidaAtual - cura);
                    const psiqueAtual = Math.min(psiqueMax, psiqueMax - novaPsiquePerdida);

                    this.actor.update({
                        "system.combate.recuperacao.psique": 0,
                        "system.status.psique.psiquePerdida": novaPsiquePerdida,
                        "system.status.psique.value": psiqueAtual
                    });
                    element.val(0);
                }
                return;
            }

            // Quando o usuário informa cura de estamina: reduz estaminaPerdida e atualiza estamina.value (até o máximo)
            if (inputId === "input-cura-estamina") {
                const cura = parseInt(value, 10) || 0;
                if (cura > 0) {
                    const estaminaPerdidaAtual = this.actor.system.status?.estamina?.estaminaPerdida ?? 0;
                    const estaminaMax = this.actor.system.status?.estamina?.max ?? 20;
                    const novaEstaminaPerdida = Math.max(0, estaminaPerdidaAtual - cura);
                    const estaminaAtual = Math.min(estaminaMax, estaminaMax - novaEstaminaPerdida);

                    this.actor.update({
                        "system.combate.recuperacao.estamina": 0,
                        "system.status.estamina.estaminaPerdida": novaEstaminaPerdida,
                        "system.status.estamina.value": estaminaAtual
                    });
                    element.val(0);
                }
                return;
            }

            // menos-energia: diminui energia.value (mestiça)
            if (inputId === "menos-energia") {
                const gasta = parseInt(value, 10) || 0;
                const energiaAtual = this.actor.system.mestica?.energia?.value ?? 0;
                const novaEnergia = Math.max(0, energiaAtual - gasta);
                this.actor.update({
                    "system.mestica.energia.value": novaEnergia,
                    "system.mestica.energia.gasta": 0
                });
                element.val(0);
                return;
            }

            // mais-energia: aumenta energia.value até energia.max (mestiça)
            if (inputId === "mais-energia") {
                const recupera = parseInt(value, 10) || 0;
                const energiaAtual = this.actor.system.mestica?.energia?.value ?? 0;
                const energiaMax = this.actor.system.mestica?.energia?.max ?? 0;
                const novaEnergia = Math.min(energiaMax, energiaAtual + recupera);
                this.actor.update({
                    "system.mestica.energia.value": novaEnergia,
                    "system.mestica.energia.recupera": 0
                });
                element.val(0);
                return;
            }

            // mais-canalizacao: aumenta canalizacao.value até canalizacao.max (mestiça)
            if (inputId === "mais-canalizacao") {
                const usa = parseInt(value, 10) || 0;
                const canalizacaoAtual = this.actor.system.mestica?.canalizacao?.value ?? 0;
                const canalizacaoMax = this.actor.system.mestica?.canalizacao?.max ?? 0;
                const novaCanalizacao = Math.min(canalizacaoMax, canalizacaoAtual + usa);
                this.actor.update({
                    "system.mestica.canalizacao.value": novaCanalizacao,
                    "system.mestica.canalizacao.usa": 0
                });
                element.val(0);
                return;
            }

            // Positivo/Negativo na aba Alterações: soma ou subtração no status max (o cálculo automático não altera esse processo)
            const delta = parseInt(value, 10) || 0;
            const applyPositivoNegativo = (inputId, pathPrefix, getCurrentMax, getCurrentPositivo, getCurrentNegativo) => {
                const isPositivo = inputId.endsWith("-positivo");
                const currentMax = getCurrentMax();
                const currentPositivo = getCurrentPositivo();
                const currentNegativo = getCurrentNegativo();
                let newMax, updateObj;
                if (isPositivo) {
                    newMax = currentMax + delta;
                    updateObj = {
                        [`${pathPrefix}.max`]: Math.max(0, newMax),
                        [`${pathPrefix}.positivo`]: currentPositivo + delta
                    };
                } else {
                    newMax = currentMax - delta;
                    updateObj = {
                        [`${pathPrefix}.max`]: Math.max(0, newMax),
                        [`${pathPrefix}.negativo`]: currentNegativo + delta
                    };
                }
                this.actor.update(updateObj);
                element.val(0);
                return true;
            };

            if (inputId === "alt-vida-positivo" || inputId === "alt-vida-negativo") {
                applyPositivoNegativo(
                    inputId,
                    "system.status.vida",
                    () => this.actor.system?.status?.vida?.max ?? 100,
                    () => this.actor.system?.status?.vida?.positivo ?? 0,
                    () => this.actor.system?.status?.vida?.negativo ?? 0
                );
                return;
            }
            if (inputId === "alt-estamina-positivo" || inputId === "alt-estamina-negativo") {
                applyPositivoNegativo(
                    inputId,
                    "system.status.estamina",
                    () => this.actor.system?.status?.estamina?.max ?? 20,
                    () => this.actor.system?.status?.estamina?.positivo ?? 0,
                    () => this.actor.system?.status?.estamina?.negativo ?? 0
                );
                return;
            }
            if (inputId === "alt-psique-positivo" || inputId === "alt-psique-negativo") {
                applyPositivoNegativo(
                    inputId,
                    "system.status.psique",
                    () => this.actor.system?.status?.psique?.max ?? 100,
                    () => this.actor.system?.status?.psique?.positivo ?? 0,
                    () => this.actor.system?.status?.psique?.negativo ?? 0
                );
                return;
            }
            if (inputId === "alt-energia-positivo" || inputId === "alt-energia-negativo") {
                applyPositivoNegativo(
                    inputId,
                    "system.mestica.energia",
                    () => this.actor.system?.mestica?.energia?.max ?? 0,
                    () => this.actor.system?.mestica?.energia?.positivo ?? 0,
                    () => this.actor.system?.mestica?.energia?.negativo ?? 0
                );
                return;
            }
            if (inputId === "alt-canalizacao-positivo" || inputId === "alt-canalizacao-negativo") {
                applyPositivoNegativo(
                    inputId,
                    "system.mestica.canalizacao",
                    () => this.actor.system?.mestica?.canalizacao?.max ?? 0,
                    () => this.actor.system?.mestica?.canalizacao?.positivo ?? 0,
                    () => this.actor.system?.mestica?.canalizacao?.negativo ?? 0
                );
                return;
            }
            // Passivas (resist, percep, esquiva): soma/subtrai do valor exibido e acumula em positivo/negativo
            const applyPassivaPositivoNegativo = (inputId, pathPrefix, getCurrentValue, getCurrentPositivo, getCurrentNegativo) => {
                const isPositivo = inputId.endsWith("-positivo");
                const currentVal = getCurrentValue();
                const currentPositivo = getCurrentPositivo();
                const currentNegativo = getCurrentNegativo();
                let newVal;
                if (isPositivo) {
                    newVal = currentVal + delta;
                    this.actor.update({
                        [`${pathPrefix}.value`]: newVal,
                        [`${pathPrefix}.positivo`]: currentPositivo + delta
                    });
                } else {
                    newVal = currentVal - delta;
                    this.actor.update({
                        [`${pathPrefix}.value`]: Math.max(0, newVal),
                        [`${pathPrefix}.negativo`]: currentNegativo + delta
                    });
                }
                element.val(0);
            };
            const rp = this.actor.system?.status?.["resist-pas"];
            const pp = this.actor.system?.status?.["percep-pas"];
            const ep = this.actor.system?.status?.["esquiva-pas"];
            if (inputId === "alt-resist-pas-positivo" || inputId === "alt-resist-pas-negativo") {
                const val = typeof rp === "object" ? (rp?.value ?? 0) : (rp ?? 0);
                const pos = typeof rp === "object" ? (rp?.positivo ?? 0) : 0;
                const neg = typeof rp === "object" ? (rp?.negativo ?? 0) : 0;
                applyPassivaPositivoNegativo(inputId, "system.status.resist-pas", () => val, () => pos, () => neg);
                return;
            }
            if (inputId === "alt-percep-pas-positivo" || inputId === "alt-percep-pas-negativo") {
                const val = typeof pp === "object" ? (pp?.value ?? 5) : (pp ?? 5);
                const pos = typeof pp === "object" ? (pp?.positivo ?? 0) : 0;
                const neg = typeof pp === "object" ? (pp?.negativo ?? 0) : 0;
                applyPassivaPositivoNegativo(inputId, "system.status.percep-pas", () => val, () => pos, () => neg);
                return;
            }
            if (inputId === "alt-esquiva-pas-positivo" || inputId === "alt-esquiva-pas-negativo") {
                const val = typeof ep === "object" ? (ep?.value ?? 0) : (ep ?? 0);
                const pos = typeof ep === "object" ? (ep?.positivo ?? 0) : 0;
                const neg = typeof ep === "object" ? (ep?.negativo ?? 0) : 0;
                applyPassivaPositivoNegativo(inputId, "system.status.esquiva-pas", () => val, () => pos, () => neg);
                return;
            }
            // Atributos: soma/subtrai do dados e acumula em positivo/negativo
            const atributosAlt = ["forca", "constituicao", "destreza", "mobilidade", "mente", "moral"];
            for (const atr of atributosAlt) {
                const posId = `alt-${atr}-positivo`;
                const negId = `alt-${atr}-negativo`;
                if (inputId === posId || inputId === negId) {
                    const currentDados = this.actor.system?.atributos?.[atr]?.dados ?? 1;
                    const currentPos = this.actor.system?.atributos?.[atr]?.positivo ?? 0;
                    const currentNeg = this.actor.system?.atributos?.[atr]?.negativo ?? 0;
                    const isPositivo = inputId === posId;
                    const newDados = isPositivo ? currentDados + delta : Math.max(0, currentDados - delta);
                    this.actor.update({
                        [`system.atributos.${atr}.dados`]: newDados,
                        [`system.atributos.${atr}.positivo`]: isPositivo ? currentPos + delta : currentPos,
                        [`system.atributos.${atr}.negativo`]: isPositivo ? currentNeg : currentNeg + delta
                    });
                    element.val(0);
                    return;
                }
            }

            // Map input IDs to actor system paths (v10+)
            const fieldMap = {
                "input-nome-personagem": "system.informacoes.nome",
                "input-data-nascimento-personagem": "system.informacoes.data-nascimento",
                "input-data-atual": "system.informacoes.data-atual",
                "input-idade-personagem": "system.informacoes.idade",
                "input-altura": "system.informacoes.altura",
                "input-peso-personagem": "system.informacoes.peso",
                "input-mao-dominante": "system.informacoes.mao-dominante",
                "input-dinheiro": "system.informacoes.dinheiro",
                "input-geas": "system.informacoes.geas",
                "input-vida": "system.status.vida.value",
                "input-estamina": "system.status.estamina.value",
                "input-psique": "system.status.psique.value",
                "input-resist-pas": "system.status.resist-pas",
                "input-percep-pas": "system.status.percep-pas",
                "input-esquiva-pas": "system.status.esquiva-pas",
                "input-forca": "system.atributos.forca.value",
                "input-constituicao": "system.atributos.constituicao.value",
                "input-destreza": "system.atributos.destreza.value",
                "input-mobilidade": "system.atributos.mobilidade.value",
                "input-mente": "system.atributos.mente.value",
                "input-moral": "system.atributos.moral.value",
                "input-dano-recebido": "system.combate.dano.recebido",
                "input-dano-psique": "system.combate.dano.psique",
                "input-cura": "system.combate.recuperacao.vida",
                "input-cura-psique": "system.combate.recuperacao.psique",
                "equipamento-esquerda": "system.equipamento.esquerda",
                "equipamento-direita": "system.equipamento.direita",
                "equipamento-cabeca": "system.equipamento.cabeca",
                "equipamento-tronco": "system.equipamento.tronco",
                "equipamento-inferiores": "system.equipamento.inferiores",
                "equipamento-rapido": "system.equipamento.rapido",
                "inventario": "system.inventario",
                "nome-mestica": "system.mestica.nome",
                "idade-mestica": "system.mestica.idade",
                "forma": "system.mestica.forma",
                "afinidade": "system.mestica.afinidade",
                "peso-mestica": "system.mestica.peso",
                "dano-mestica": "system.mestica.dano",
                "text-peculiaridades": "system.mestica.peculiaridades",
                "text-tecnicas": "system.mestica.tecnicas",
                "text-ate-aonde-iria": "system.demais-informacoes.ate-aonde-iria",
                "text-nascimento-mestica": "system.demais-informacoes.nascimento-mestica",
                "text-anotacoes": "system.demais-informacoes.anotacoes",

                // Campos de override na aba Alterações (não disparam cálculos automáticos)
                "alt-vida-max": "system.status.vida.max",
                "alt-vida-value": "system.status.vida.value",
                "alt-estamina-max": "system.status.estamina.max",
                "alt-estamina-value": "system.status.estamina.value",
                "alt-psique-max": "system.status.psique.max",
                "alt-psique-value": "system.status.psique.value",
                "alt-resist-pas": "system.status.resist-pas.value",
                "alt-percep-pas": "system.status.percep-pas.value",
                "alt-esquiva-pas": "system.status.esquiva-pas.value",
                "alt-energia-max": "system.mestica.energia.max",
                "alt-energia-value": "system.mestica.energia.value",
                "alt-canalizacao-max": "system.mestica.canalizacao.max",
                "alt-canalizacao-value": "system.mestica.canalizacao.value",
                "alt-nome": "system.informacoes.nome",
                "alt-idade": "system.informacoes.idade",
                "alt-data-nascimento": "system.informacoes.data-nascimento",
                "alt-data-atual": "system.informacoes.data-atual",
                "alt-altura": "system.informacoes.altura",
                "alt-peso": "system.informacoes.peso",
                "alt-mao-dominante": "system.informacoes.mao-dominante",
                "alt-dinheiro": "system.informacoes.dinheiro",
                "alt-moradia": "system.informacoes.moradia",
                "alt-geas": "system.informacoes.geas",
                "alt-mestica-nome": "system.mestica.nome",
                "alt-mestica-idade": "system.mestica.idade",
                "alt-mestica-forma": "system.mestica.forma",
                "alt-mestica-afinidade": "system.mestica.afinidade",
                "alt-mestica-peso": "system.mestica.peso",
                "alt-mestica-dano": "system.mestica.dano",
                "alt-forca-value": "system.atributos.forca.value",
                "alt-forca-dados": "system.atributos.forca.dados",
                "alt-constituicao-value": "system.atributos.constituicao.value",
                "alt-constituicao-dados": "system.atributos.constituicao.dados",
                "alt-destreza-value": "system.atributos.destreza.value",
                "alt-destreza-dados": "system.atributos.destreza.dados",
                "alt-mobilidade-value": "system.atributos.mobilidade.value",
                "alt-mobilidade-dados": "system.atributos.mobilidade.dados",
                "alt-mente-value": "system.atributos.mente.value",
                "alt-mente-dados": "system.atributos.mente.dados",
                "alt-moral-value": "system.atributos.moral.value",
                "alt-moral-dados": "system.atributos.moral.dados",
                "alt-dano-recebido": "system.combate.dano.recebido",
                "alt-dano-estamina": "system.combate.dano.estamina",
                "alt-dano-psique": "system.combate.dano.psique",
                "alt-dano-total": "system.combate.dano.total",
                "alt-dano-porcentagem": "system.combate.dano.porcentagem",
                "alt-recup-vida": "system.combate.recuperacao.vida",
                "alt-recup-estamina": "system.combate.recuperacao.estamina",
                "alt-recup-psique": "system.combate.recuperacao.psique",
                "alt-equip-esquerda": "system.equipamento.esquerda",
                "alt-equip-direita": "system.equipamento.direita",
                "alt-equip-cabeca": "system.equipamento.cabeca",
                "alt-equip-tronco": "system.equipamento.tronco",
                "alt-equip-inferiores": "system.equipamento.inferiores",
                "alt-equip-rapido": "system.equipamento.rapido",
                "alt-inventario": "system.inventario",
                "alt-peculiaridades": "system.mestica.peculiaridades",
                "alt-tecnicas": "system.mestica.tecnicas"
            };

            const updatePath = fieldMap[inputId];
            if (updatePath) {
                const updateObj = { [updatePath]: value };
                const valueInt = parseInt(value, 10) || 0;

                // ========== CÁLCULOS PARA ATRIBUTOS ==========
                const atributosLista = ['forca', 'constituicao', 'destreza', 'mobilidade', 'mente', 'moral'];
                if (atributosLista.some(atr => inputId === `input-${atr}`)) {
                    // Calcula dados do atributo: 1 + (valor / 4) arredondado para baixo
                    const dados = 1 + Math.trunc(valueInt / 4);
                    const atributo = inputId.replace("input-", "");
                    updateObj[`system.atributos.${atributo}.dados`] = dados;

                    // Se for constituição, também calcula vida máxima
                    if (atributo === 'constituicao') {
                        const vida = this.calculateVidaMax(valueInt);
                        updateObj['system.status.vida.max'] = vida.max;
                        updateObj['system.status.vida.value'] = vida.value;
                        if (vida.energiaMax !== null) {
                            updateObj['system.mestica.energia.max'] = vida.energiaMax;
                            updateObj['system.mestica.energia.value'] = vida.energiaValue;
                        }
                    }

                    // Recalculate passives using helper functions
                    if (atributo === 'forca' || atributo === 'constituicao') {
                        const forcaValue = atributo === 'forca' ? valueInt : (this.actor.system.atributos.forca.value || 0);
                        const constituicaoValue = atributo === 'constituicao' ? valueInt : (this.actor.system.atributos.constituicao.value || 0);
                        updateObj['system.status.resist-pas.value'] = this.calculateResistenciaPas(forcaValue, constituicaoValue);
                    }

                    if (atributo === 'destreza' || atributo === 'mente') {
                        const destrezaValue = atributo === 'destreza' ? valueInt : (this.actor.system.atributos.destreza.value || 0);
                        const menteValue = atributo === 'mente' ? valueInt : (this.actor.system.atributos.mente.value || 0);
                        updateObj['system.status.percep-pas.value'] = this.calculatePercepPas(destrezaValue, menteValue);
                    }

                    if (atributo === 'mobilidade') {
                        updateObj['system.status.esquiva-pas.value'] = this.calculateEsquivaPas(valueInt);
                    }

                    if (atributo === 'constituicao' || atributo === 'destreza') {
                        const constituicaoValue = atributo === 'constituicao' ? valueInt : (this.actor.system.atributos.constituicao.value || 0);
                        const destrezaValue = atributo === 'destreza' ? valueInt : (this.actor.system.atributos.destreza.value || 0);
                        const est = this.calculateEstamina(constituicaoValue, destrezaValue);
                        updateObj['system.status.estamina.bonus'] = est.bonus;
                        updateObj['system.status.estamina.max'] = est.max;
                        updateObj['system.status.estamina.value'] = est.value;
                    }
                }

                this.actor.update(updateObj);
            }
        });
    }

}
