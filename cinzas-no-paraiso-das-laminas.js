import jogadorSheet from "./module/sheets/personagem-sheet.js";

async function preloadHandlebarsTemplates() {
  const templatePaths = [
    "systems/cinzas-no-paraiso-das-laminas/templates/partials/personagem/ficha-informacoes.hbs",
    "systems/cinzas-no-paraiso-das-laminas/templates/partials/personagem/proeficiencias.hbs",
    "systems/cinzas-no-paraiso-das-laminas/templates/partials/personagem/inventario-equipamento.hbs",
    "systems/cinzas-no-paraiso-das-laminas/templates/partials/personagem/ficha-personagem.hbs",
    "systems/cinzas-no-paraiso-das-laminas/templates/partials/mestica/ficha-mestica.hbs",
    "systems/cinzas-no-paraiso-das-laminas/templates/partials/alteracoes/ficha-alteracoes.hbs",
    "systems/cinzas-no-paraiso-das-laminas/templates/partials/demais-informacoes/ficha-demais-informacoes.hbs"
  ];

  return loadTemplates(templatePaths);
};

Hooks.once("init", function () {
  console.log("Cinzas no Paraíso das Lâminas | Inicializando o sistema Cinzas no Paraíso das Lâminas");

  // Registrar helper Handlebars para trim
  Handlebars.registerHelper('trim', function(value) {
    if (typeof value === 'string') {
      return new Handlebars.SafeString(value.trim());
    }
    return value;
  });

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("cinzas-no-paraiso-das-laminas", jogadorSheet, {
    types: ["Jogador", "NPC"],
    makeDefault: true,
  });

  preloadHandlebarsTemplates();
});