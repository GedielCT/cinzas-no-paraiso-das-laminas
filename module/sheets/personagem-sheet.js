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
    calculateVidaMax(constituicaoValue = null, saudeAtiva = null, overrides = null) {
        const vidaPadrao = 100;
        constituicaoValue = constituicaoValue ?? (this.actor.system.atributos.constituicao.value || 0);
        saudeAtiva = saudeAtiva ?? (this.actor.system.proeficiencias?.constituicao?.terceiro?.ativo || false);
        const ov = overrides && typeof overrides === "object" ? overrides : {};
        const stV = this.actor.system?.status?.vida;
        const positivo = ov.positivo !== undefined ? ov.positivo : (stV?.positivo || 0);
        const negativo = ov.negativo !== undefined ? ov.negativo : (stV?.negativo || 0);

        // Calcula vida máxima base: 100 + (constituição * 10)
        let vidaBase = (vidaPadrao + (constituicaoValue * 10));
        
        // Se proficiência "Saúde" está ativa, dobra a vida máxima
        if (saudeAtiva) {
            vidaBase = vidaBase * 2;
        }

        const metadeVida = vidaBase / 2;
        const energiaMax = this.actor.system.mestica?.energia?.max ?? 0;
        
        const vidaMax = Math.max(0, vidaBase + positivo - negativo);
        const vidaPerdida = stV?.vidaPerdida ?? 0;
        const vidaValue = Math.max(0, vidaMax - vidaPerdida);

        return {
            max: vidaMax,
            base: vidaBase,
            value: vidaValue,
            energiaMax: metadeVida > energiaMax ? metadeVida : null,
            energiaValue: metadeVida > energiaMax ? Math.max(0, metadeVida) : null
        };
    }

    /** Psique: max = base + positivo − negativo; value = max − psiquePerdida. `overrides`: positivo, negativo, psiquePerdida. */
    calculatePsique(overrides = null) {
        const st = this.actor.system?.status?.psique;
        const ov = overrides && typeof overrides === "object" ? overrides : {};
        const base = st?.base ?? 100;
        const rawPerdida = st?.psiquePerdida ?? 0;
        const positivo = ov.positivo !== undefined ? ov.positivo : (st?.positivo ?? 0);
        const negativo = ov.negativo !== undefined ? ov.negativo : (st?.negativo ?? 0);
        const psiquePerdida = ov.psiquePerdida !== undefined ? ov.psiquePerdida : rawPerdida;
        const max = Math.max(0, base + positivo - negativo);
        const value = Math.max(0, max - psiquePerdida);
        return { base, max, value, psiquePerdida };
    }

    /** Cálculo de estamina. `overrides`: estaminaPerdida (absoluto), deltaEstaminaPerdida (soma ao valor do ator), positivo, negativo. */
    calculateEstamina(constituicaoValue = null, destrezaValue = null, constituicaoFolego = null, destrezaEquilibrio = null, overrides = null) {
        const estaminaPadrao = 20;
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
        
        const estaminaBase = estaminaPadrao + bonusEstamina;
        const st = this.actor.system?.status?.estamina;
        const ov = overrides && typeof overrides === "object" ? overrides : {};
        const rawPerdida = st?.estaminaPerdida ?? 0;
        let estaminaPerdida;
        if (ov.estaminaPerdida !== undefined) {
            estaminaPerdida = ov.estaminaPerdida;
        } else if (ov.deltaEstaminaPerdida !== undefined) {
            estaminaPerdida = Math.max(0, rawPerdida + ov.deltaEstaminaPerdida);
        } else {
            estaminaPerdida = rawPerdida;
        }
        const positivo = ov.positivo !== undefined ? ov.positivo : (st?.positivo ?? 0);
        const negativo = ov.negativo !== undefined ? ov.negativo : (st?.negativo ?? 0);
        const estaminaMax = Math.max(0, estaminaBase + positivo - negativo);
        const estaminaValue = Math.max(0, (estaminaBase - estaminaPerdida) + positivo - negativo);
        
        return { base: estaminaBase, max: estaminaMax, value: estaminaValue, estaminaPerdida };
    }

    calculateResistenciaPas(forcaValue = null, constituicaoValue = null, resistForca = null, resistConstituicao = null, overrides = null) {
        const resistPadrao = 5;
        resistForca = resistForca ?? (this.actor.system.proeficiencias?.forca?.primeiro?.ativo || false);
        resistConstituicao = resistConstituicao ?? (this.actor.system.proeficiencias?.constituicao?.primeiro?.ativo || false);
        const ov = overrides && typeof overrides === "object" ? overrides : {};
        const rpSt = this.actor.system.status?.["resist-pas"];
        const positivo = ov.positivo !== undefined ? ov.positivo : (rpSt?.positivo || 0);
        const negativo = ov.negativo !== undefined ? ov.negativo : (rpSt?.negativo || 0);
        
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
        let resistValue = resistPas + positivo - negativo;
        return {
            base: resistPas,
            value: resistValue,
        };
    }

    calculatePercepPas(destrezaValue = null, menteValue = null, percepDestreza = null, percepMente = null, overrides = null) {
        const percepPadrao = 5;
        percepDestreza = percepDestreza ?? (this.actor.system.proeficiencias?.destreza?.primeiro?.ativo || false);
        percepMente = percepMente ?? (this.actor.system.proeficiencias?.mente?.terceiro?.ativo || false);
        const ov = overrides && typeof overrides === "object" ? overrides : {};
        const ppSt = this.actor.system.status?.["percep-pas"];
        const positivo = ov.positivo !== undefined ? ov.positivo : (ppSt?.positivo || 0);
        const negativo = ov.negativo !== undefined ? ov.negativo : (ppSt?.negativo || 0);
        
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
        let percepValue = percepPas + positivo - negativo;
        return {
            base: percepPas,
            value: percepValue,
        };
    }

    calculateEsquivaPas(mobilidadeValue = null, esquivaMobilidade = null, overrides = null) {
        const esquivaPadrao = 6;
        esquivaMobilidade = esquivaMobilidade ?? (this.actor.system.proeficiencias?.mobilidade?.primeiro?.ativo || false);
        const ov = overrides && typeof overrides === "object" ? overrides : {};
        const epSt = this.actor.system.status?.["esquiva-pas"];
        const positivo = ov.positivo !== undefined ? ov.positivo : (epSt?.positivo || 0);
        const negativo = ov.negativo !== undefined ? ov.negativo : (epSt?.negativo || 0);
        
        mobilidadeValue = mobilidadeValue ?? (this.actor.system.atributos.mobilidade.value || 0);
        
        let esquivaPas = esquivaPadrao;
        if ((esquivaMobilidade) && (mobilidadeValue % 3 === 0) && (mobilidadeValue >= 6)) {
            esquivaPas = esquivaPadrao + (Math.trunc(mobilidadeValue / 2) * 2);
        } else if (esquivaMobilidade) {
            esquivaPas = esquivaPadrao + Math.trunc(mobilidadeValue / 2);
        } else {
            esquivaPas = 0;
        }
        let esquivaValue = esquivaPas + positivo - negativo;
        return {
            base: esquivaPas,
            value: esquivaValue,
        };
    }

    /**
     * Recalcula dados de atributo: base = max(1, parte inteira de atributo.total / 4), value = max(1, base + positivo − negativo).
     * @param {string|null} atributoKey — forca | … | moral, ou null para todos
     * @param {object} partial — atributoTotal (ao atualizar atributo), ou base/positivo/negativo/value para edição dos dados
     */
    calculateDados(atributoKey = null, partial = {}) {
        const keys = ["forca", "constituicao", "destreza", "mobilidade", "mente", "moral"];
        const targets = atributoKey && keys.includes(atributoKey) ? [atributoKey] : keys;
        const out = {};
        const readNum = (k, d, field, def = 0) => {
            const usePartial = atributoKey !== null && k === atributoKey;
            if (usePartial && partial[field] !== undefined && partial[field] !== "" && partial[field] !== null) {
                const x = parseInt(String(partial[field]), 10);
                return Number.isFinite(x) ? x : def;
            }
            const y = d[field];
            if (typeof y === "number" && Number.isFinite(y)) return y;
            const z = parseInt(String(y ?? def), 10);
            return Number.isFinite(z) ? z : def;
        };

        for (const k of targets) {
            const a = this.actor.system?.atributos?.[k] ?? {};
            const d = this.actor.system?.dados?.[k] ?? {};
            const attrTotal = partial.atributoTotal !== undefined && k === atributoKey
                ? Math.max(0, parseInt(String(partial.atributoTotal), 10) || 0)
                : Math.max(0, typeof a.value === "number" && Number.isFinite(a.value) ? a.value : (parseInt(String(a.value ?? 0), 10) || 0));
            const base = Math.trunc(1 + (attrTotal / 4));
            const hasExplicitValue = atributoKey !== null && k === atributoKey && partial.value !== undefined && partial.value !== "" && partial.value !== null;
            const positivo = readNum(k, d, "positivo");
            const negativo = readNum(k, d, "negativo");
            const value = hasExplicitValue
                ? Math.max(1, parseInt(String(partial.value), 10) || 0)
                : Math.max(1, base + positivo - negativo);
            const path = `system.dados.${k}`;
            if (hasExplicitValue) {
                out[`${path}.value`] = value;
            } else {
                out[`${path}.base`] = base;
                out[`${path}.positivo`] = positivo;
                out[`${path}.negativo`] = negativo;
                out[`${path}.value`] = value;
            }
        }
        return out;
    }

    /**
     * Recalcula um atributo (base/positivo/negativo → value e dados) e efeitos em status derivados.
     * @param {string} atributoKey — forca | constituicao | destreza | mobilidade | mente | moral
     * @param {object} partial — subset de { base, positivo, negativo, value }; `value` explícito define total direto (ex.: input-forca)
     */
    calculateAtributo(atributoKey, partial = {}) {
        const keys = ["forca", "constituicao", "destreza", "mobilidade", "mente", "moral"];
        if (!keys.includes(atributoKey)) return {};
        const a = this.actor.system?.atributos?.[atributoKey] ?? {};
        const read = (k, def = 0) => {
            if (partial[k] !== undefined && partial[k] !== "" && partial[k] !== null) {
                const x = parseInt(String(partial[k]), 10);
                return Number.isFinite(x) ? x : def;
            }
            const y = a[k];
            if (typeof y === "number" && Number.isFinite(y)) return y;
            const z = parseInt(String(y ?? def), 10);
            return Number.isFinite(z) ? z : def;
        };
        const hasExplicitValue = partial.value !== undefined && partial.value !== "" && partial.value !== null;
        const base = read("base");
        const positivo = read("positivo");
        const negativo = read("negativo");
        const value = hasExplicitValue
            ? Math.max(0, parseInt(String(partial.value), 10) || 0)
            : Math.max(0, base + positivo - negativo);
        const out = {};
        const path = `system.atributos.${atributoKey}`;
        if (hasExplicitValue) {
            out[`${path}.value`] = value;
        } else {
            out[`${path}.base`] = base;
            out[`${path}.positivo`] = positivo;
            out[`${path}.negativo`] = negativo;
            out[`${path}.value`] = value;
        }
        const getAttrValue = (k) => (k === atributoKey ? value : (this.actor.system.atributos?.[k]?.value ?? 0));
        const fv = getAttrValue("forca");
        const cv = getAttrValue("constituicao");
        const dv = getAttrValue("destreza");
        const mv = getAttrValue("mobilidade");
        const mev = getAttrValue("mente");

        if (atributoKey === "constituicao") {
            const vida = this.calculateVidaMax(cv, null);
            out["system.status.vida.max"] = vida.max;
            out["system.status.vida.base"] = vida.base;
            out["system.status.vida.value"] = vida.value;
            if (vida.energiaMax !== null) {
                out["system.mestica.energia.max"] = vida.energiaMax;
                out["system.mestica.energia.value"] = vida.energiaValue;
            }
        }
        if (atributoKey === "forca" || atributoKey === "constituicao") {
            const resist = this.calculateResistenciaPas(fv, cv);
            out["system.status.resist-pas.base"] = resist.base;
            out["system.status.resist-pas.value"] = resist.value;
        }
        if (atributoKey === "destreza" || atributoKey === "mente") {
            const percep = this.calculatePercepPas(dv, mev);
            out["system.status.percep-pas.base"] = percep.base;
            out["system.status.percep-pas.value"] = percep.value;
        }
        if (atributoKey === "mobilidade") {
            const esquiva = this.calculateEsquivaPas(mv, null);
            out["system.status.esquiva-pas.base"] = esquiva.base;
            out["system.status.esquiva-pas.value"] = esquiva.value;
        }
        if (atributoKey === "constituicao" || atributoKey === "destreza") {
            const est = this.calculateEstamina(cv, dv);
            out["system.status.estamina.base"] = est.base;
            out["system.status.estamina.max"] = est.max;
            out["system.status.estamina.value"] = est.value;
        }
        Object.assign(out, this.calculateDados(atributoKey, { atributoTotal: value }));
        return out;
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
                    updateObj['system.status.vida.base'] = vida.base;
                    if (vida.energiaMax !== null) {
                        updateObj['system.mestica.energia.max'] = vida.energiaMax;
                        updateObj['system.mestica.energia.value'] = vida.energiaValue;
                    }
                }

                // CALCULO RESISTENCIA
                if ((atributo === "forca" || atributo === "constituicao") && order === 'primeiro') {
                    const forcaRes = atributo === 'forca' ? value : (this.actor.system.proeficiencias?.forca?.primeiro?.ativo || false);
                    const constituicaoRes = atributo === 'constituicao' ? value : (this.actor.system.proeficiencias?.constituicao?.primeiro?.ativo || false);
                    const resist = this.calculateResistenciaPas(null, null, forcaRes, constituicaoRes);
                    updateObj['system.status.resist-pas.base'] = resist.base;
                    updateObj['system.status.resist-pas.value'] = resist.value;
                }

                //CALCULO PERCEPICAO
                if ((atributo === 'destreza' && order === 'primeiro') || (atributo === 'mente' && order === 'terceiro')) {
                    const destrezaPer = atributo === 'destreza' ? value : (this.actor.system.proeficiencias?.destreza?.primeiro?.ativo || false);
                    const mentePer = atributo === 'mente' ? value : (this.actor.system.proeficiencias?.mente?.terceiro?.ativo || false);
                    const percep = this.calculatePercepPas(null, null, destrezaPer, mentePer);
                    updateObj['system.status.percep-pas.base'] = percep.base;
                    updateObj['system.status.percep-pas.value'] = percep.value;
                }

                // CALCULO ESQUIVA
                if (atributo === 'mobilidade' && order === 'primeiro') {
                    const esquivaMobilidade = atributo === 'mobilidade' ? value : (this.actor.system.proeficiencias?.mobilidade?.primeiro?.ativo || false);
                    const esquiva = this.calculateEsquivaPas(null, esquivaMobilidade);
                    updateObj['system.status.esquiva-pas.base'] = esquiva.base;
                    updateObj['system.status.esquiva-pas.value'] = esquiva.value;
                }

                // CALCULO ESTAMINA (constituição.segundo Fôlego: +10 por bônus | destreza.terceiro Equilíbrio: +5 por bônus)
                if ((atributo === 'constituicao' && order === 'segundo') || (atributo === 'destreza' && order === 'terceiro')) {
                    const constituicaoFolego = atributo === 'constituicao' ? value : (this.actor.system.proeficiencias?.constituicao?.segundo?.ativo || false);
                    const destrezaEquilibrio = atributo === 'destreza' ? value : (this.actor.system.proeficiencias?.destreza?.terceiro?.ativo || false);
                    const est = this.calculateEstamina(null, null, constituicaoFolego, destrezaEquilibrio);
                    updateObj['system.status.estamina.base'] = est.base;
                    updateObj['system.status.estamina.max'] = est.max;
                    updateObj['system.status.estamina.value'] = est.value;
                }
                
                this.actor.update(updateObj);
                return;
            };

            // ;arda em vidaPerdida, calcula % e atualiza vida.value
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
                const est = this.calculateEstamina(null, null, null, null, { deltaEstaminaPerdida: danoEstamina });

                this.actor.update({
                    "system.combate.dano.estamina": 0,
                    "system.status.estamina.estaminaPerdida": est.estaminaPerdida,
                    "system.status.estamina.base": est.base,
                    "system.status.estamina.max": est.max,
                    "system.status.estamina.value": est.value
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
                    const est = this.calculateEstamina(null, null, null, null, { deltaEstaminaPerdida: -cura });

                    this.actor.update({
                        "system.combate.recuperacao.estamina": 0,
                        "system.status.estamina.estaminaPerdida": est.estaminaPerdida,
                        "system.status.estamina.base": est.base,
                        "system.status.estamina.max": est.max,
                        "system.status.estamina.value": est.value
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

            // Mestiça (energia/canalização) na aba Alterações: ainda usa delta somado ao max e aos acumuladores
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

            if (inputId === "vida-positivo" || inputId === "vida-negativo") {
                const isPositivo = inputId.endsWith("-positivo");
                const s = this.actor.system?.status?.vida;
                const typed = parseInt(value, 10) || 0;
                const newPos = isPositivo ? Math.max(0, typed) : (s?.positivo ?? 0);
                const newNeg = isPositivo ? (s?.negativo ?? 0) : Math.max(0, typed);
                const vida = this.calculateVidaMax(null, null, { positivo: newPos, negativo: newNeg });
                const upd = {
                    "system.status.vida.positivo": newPos,
                    "system.status.vida.negativo": newNeg,
                    "system.status.vida.max": vida.max,
                    "system.status.vida.base": vida.base,
                    "system.status.vida.value": vida.value
                };
                if (vida.energiaMax !== null) {
                    upd["system.mestica.energia.max"] = vida.energiaMax;
                    upd["system.mestica.energia.value"] = vida.energiaValue;
                }
                this.actor.update(upd);
                element.val(String(isPositivo ? newPos : newNeg));
                return;
            }
            if (inputId === "estamina-positivo" || inputId === "estamina-negativo") {
                const isPositivo = inputId.endsWith("-positivo");
                const s = this.actor.system?.status?.estamina;
                const currentPos = s?.positivo ?? 0;
                const currentNeg = s?.negativo ?? 0;
                const typed = parseInt(value, 10) || 0;
                const newPos = isPositivo ? Math.max(0, typed) : currentPos;
                const newNeg = isPositivo ? currentNeg : Math.max(0, typed);
                const est = this.calculateEstamina(null, null, null, null, { positivo: newPos, negativo: newNeg });
                this.actor.update({
                    "system.status.estamina.positivo": newPos,
                    "system.status.estamina.negativo": newNeg,
                    "system.status.estamina.base": est.base,
                    "system.status.estamina.max": est.max,
                    "system.status.estamina.value": est.value
                });
                element.val(String(isPositivo ? newPos : newNeg));
                return;
            }
            if (inputId === "psique-positivo" || inputId === "psique-negativo") {
                const isPositivo = inputId.endsWith("-positivo");
                const s = this.actor.system?.status?.psique;
                const typed = parseInt(value, 10) || 0;
                const newPos = isPositivo ? Math.max(0, typed) : (s?.positivo ?? 0);
                const newNeg = isPositivo ? (s?.negativo ?? 0) : Math.max(0, typed);
                const pq = this.calculatePsique({ positivo: newPos, negativo: newNeg });
                this.actor.update({
                    "system.status.psique.positivo": newPos,
                    "system.status.psique.negativo": newNeg,
                    "system.status.psique.base": pq.base,
                    "system.status.psique.max": pq.max,
                    "system.status.psique.value": pq.value
                });
                element.val(String(isPositivo ? newPos : newNeg));
                return;
            }
            if (inputId === "energia-positivo" || inputId === "energia-negativo") {
                applyPositivoNegativo(
                    inputId,
                    "system.mestica.energia",
                    () => this.actor.system?.mestica?.energia?.max ?? 0,
                    () => this.actor.system?.mestica?.energia?.positivo ?? 0,
                    () => this.actor.system?.mestica?.energia?.negativo ?? 0
                );
                return;
            }
            if (inputId === "canalizacao-positivo" || inputId === "canalizacao-negativo") {
                applyPositivoNegativo(
                    inputId,
                    "system.mestica.canalizacao",
                    () => this.actor.system?.mestica?.canalizacao?.max ?? 0,
                    () => this.actor.system?.mestica?.canalizacao?.positivo ?? 0,
                    () => this.actor.system?.mestica?.canalizacao?.negativo ?? 0
                );
                return;
            }
            // Passivas (resist, percep, esquiva): valor absoluto em positivo/negativo temporário; value/base recalculados
            const applyPassivaTempAbsoluto = (inputId, pathKey, calcFn) => {
                const isPositivo = inputId.endsWith("-positivo");
                const obj = this.actor.system?.status?.[pathKey];
                const typed = parseInt(value, 10) || 0;
                const pos = typeof obj === "object" ? (obj?.positivo ?? 0) : 0;
                const neg = typeof obj === "object" ? (obj?.negativo ?? 0) : 0;
                const newPos = isPositivo ? Math.max(0, typed) : pos;
                const newNeg = isPositivo ? neg : Math.max(0, typed);
                const baseVal = calcFn({ positivo: 0, negativo: 0 });
                const newVal = calcFn({ positivo: newPos, negativo: newNeg });
                const path = `system.status.${pathKey}`;
                this.actor.update({
                    [`${path}.value`]: newVal,
                    [`${path}.positivo`]: newPos,
                    [`${path}.negativo`]: newNeg,
                    [`${path}.base`]: baseVal
                });
                element.val(String(isPositivo ? newPos : newNeg));
            };
            if (inputId === "resist-pas-positivo" || inputId === "resist-pas-negativo") {
                applyPassivaTempAbsoluto(inputId, "resist-pas", (ov) => this.calculateResistenciaPas(null, null, null, null, ov));
                return;
            }
            if (inputId === "percep-pas-positivo" || inputId === "percep-pas-negativo") {
                applyPassivaTempAbsoluto(inputId, "percep-pas", (ov) => this.calculatePercepPas(null, null, null, null, ov));
                return;
            }
            if (inputId === "esquiva-pas-positivo" || inputId === "esquiva-pas-negativo") {
                applyPassivaTempAbsoluto(inputId, "esquiva-pas", (ov) => this.calculateEsquivaPas(null, null, ov));
                return;
            }
            const atributosLista = ["forca", "constituicao", "destreza", "mobilidade", "mente", "moral"];
            const mAttr = typeof inputId === "string"
                ? inputId.match(/^atributos-(forca|constituicao|destreza|mobilidade|mente|moral)-(base|positivo|negativo|total)$/)
                : null;
            if (mAttr) {
                const atr = mAttr[1];
                const field = mAttr[2];
                const partial = {};
                const num = parseInt(value, 10) || 0;
                if (field === "total") partial.value = num;
                else partial[field] = num;
                const upd = this.calculateAtributo(atr, partial);
                if (Object.keys(upd).length) this.actor.update(upd);
                const pathKey = `system.atributos.${atr}.${field}`;
                if (upd[pathKey] !== undefined) element.val(String(upd[pathKey]));
                else if (field === "total" && upd[`system.atributos.${atr}.value`] !== undefined) {
                    element.val(String(upd[`system.atributos.${atr}.value`]));
                } else {
                    element.val(String(num));
                }
                return;
            }
            const mDados = typeof inputId === "string"
                ? inputId.match(/^dados-(forca|constituicao|destreza|mobilidade|mente|moral)-(positivo|negativo|total)$/)
                : null;
            if (mDados) {
                const atr = mDados[1];
                const field = mDados[2];
                const partial = {};
                const num = parseInt(value, 10) || 0;
                if (field === "total") partial.value = num;
                else partial[field] = num;
                const upd = this.calculateDados(atr, partial);
                if (Object.keys(upd).length) this.actor.update(upd);
                const pathKey = `system.dados.${atr}.${field}`;
                if (upd[pathKey] !== undefined) element.val(String(upd[pathKey]));
                else if (field === "total" && upd[`system.dados.${atr}.value`] !== undefined) {
                    element.val(String(upd[`system.dados.${atr}.value`]));
                } else {
                    element.val(String(num));
                }
                return;
            }
            if (atributosLista.some((a) => inputId === `input-${a}`)) {
                const atr = atributosLista.find((a) => inputId === `input-${a}`);
                const upd = this.calculateAtributo(atr, { value: parseInt(value, 10) || 0 });
                if (Object.keys(upd).length) this.actor.update(upd);
                if (upd[`system.atributos.${atr}.value`] !== undefined) {
                    element.val(String(upd[`system.atributos.${atr}.value`]));
                }
                return;
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
                "input-estamina-base": "system.status.estamina.base",
                "input-psique": "system.status.psique.value",
                "input-resist-pas": "system.status.resist-pas",
                "input-percep-pas": "system.status.percep-pas",
                "input-esquiva-pas": "system.status.esquiva-pas",
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
            };

            const updatePath = fieldMap[inputId];
            if (updatePath) {
                const updateObj = { [updatePath]: value };
                this.actor.update(updateObj);
            }
        });
    }

}
