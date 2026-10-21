/* =====================================================================
   Criação de Personagem — Clãs, Personagens, Jutsus e Atributos
   Dados fiéis ao anime Naruto. Persistência apenas em memória.
   ===================================================================== */

(function () {
    "use strict";

    // Pontos de atributo concedidos na criação + por nível.
    const ATTR_POINTS_CREATION = 12;
    const ATTR_POINTS_PER_LEVEL = 3;
    const STARTING_COINS = 1500;

    // Definição dos atributos exibidos/alocados.
    const ATTRIBUTE_DEFS = {
        forca: { label: "Força", icon: "\u2694", desc: "Aumenta o dano de Taijutsu e ataques físicos." },
        agilidade: { label: "Agilidade", icon: "\uD83D\uDCA8", desc: "Aumenta a chance de desviar de ataques." },
        chakra: { label: "Chakra", icon: "\uD83C\uDF00", desc: "Aumenta o Chakra máximo e o dano de Jutsu." },
        vitalidade: { label: "Vitalidade", icon: "\u2764", desc: "Aumenta a Vida máxima." },
        controle: { label: "Controle de Chakra", icon: "\uD83C\uDFAF", desc: "Aumenta a precisão e reduz o desvio inimigo." }
    };

    // Clãs / aldeias. Cada clã possui um pool de cartas comprável e personagens.
    const clans = {
        folha: {
            id: "folha",
            name: "Clã da Folha",
            village: "Konoha",
            element: "Vento",
            symbol: "\uD83C\uDF43",
            color: "#3fae5b",
            desc: "Ninjas de Konohagakure. Equilibrados entre Taijutsu, Ninjutsu e trabalho em equipe.",
            cardPool: ["jutsu001", "jutsu003", "jutsu030", "jutsu031", "jutsu032", "jutsu056", "jutsu012", "jutsu013", "taijutsu001", "taijutsu002", "taijutsu003", "buff001", "item001", "item003", "item006", "armor001", "armor002"],
            characters: {
                naruto: {
                    id: "naruto", name: "Naruto Uzumaki", clan: "folha", element: "Vento",
                    title: "O Jinchuuriki da Raposa", color: "#f5a623",
                    signature: { name: "Rasengan", cardId: "jutsu001", desc: "Esfera de chakra rotativa. Causa dano massivo de Vento." },
                    jutsu: { cardId: "jutsu001", cost: 30, attack: 40, element: "Vento", power: 60, effect: "knockback" },
                    baseAttributes: { forca: 6, agilidade: 6, chakra: 9, vitalidade: 8, controle: 5 },
                    startCards: ["jutsu001", "taijutsu001", "taijutsu001", "item001", "item001", "jutsu003"],
                    desc: "Determinado e incansável. Especialista em Rasengan e clones das sombras."
                },
                sasuke: {
                    id: "sasuke", name: "Sasuke Uchiha", clan: "folha", element: "Raio",
                    title: "O Último Uchiha", color: "#5b6c8a",
                    signature: { name: "Chidori", cardId: "jutsu002", desc: "Lâmina de relâmpago perfurante. Alta chance crítica." },
                    jutsu: { cardId: "jutsu002", cost: 35, attack: 45, element: "Raio", power: 65, critChance: 0.15, effect: "piercing" },
                    baseAttributes: { forca: 7, agilidade: 8, chakra: 8, vitalidade: 6, controle: 6 },
                    startCards: ["jutsu002", "jutsu004", "taijutsu002", "item001", "item001"],
                    desc: "Gênio frio e vingativo. Combina velocidade do Chidori com o Sharingan."
                },
                sakura: {
                    id: "sakura", name: "Sakura Haruno", clan: "folha", element: "Nenhum",
                    title: "A Kunoichi Médica", color: "#e8789f",
                    signature: { name: "Jutsu Médico", cardId: "jutsu012", desc: "Canaliza chakra de cura para restaurar Vitalidade." },
                    jutsu: { cardId: "jutsu012", cost: 25, attack: 0, element: "Nenhum", power: 40, effect: "heal" },
                    baseAttributes: { forca: 5, agilidade: 5, chakra: 8, vitalidade: 7, controle: 10 },
                    startCards: ["jutsu012", "taijutsu001", "item006", "item006", "buff002"],
                    desc: "Controle de chakra perfeito e força sobre-humana. Excelente suporte."
                },
                kakashi: {
                    id: "kakashi", name: "Kakashi Hatake", clan: "folha", element: "Raio",
                    title: "O Ninja Copiador", color: "#8a8f98",
                    signature: { name: "Raikiri", cardId: "jutsu020", desc: "Corta o relâmpago. Dano perfurante que ignora defesa." },
                    jutsu: { cardId: "jutsu020", cost: 35, attack: 45, element: "Raio", power: 70, effect: "ignore_defense_value" },
                    baseAttributes: { forca: 6, agilidade: 8, chakra: 9, vitalidade: 6, controle: 8 },
                    startCards: ["jutsu020", "jutsu003", "item004", "item003", "buff003"],
                    desc: "Veterano versátil. Copia mais de mil jutsus com seu Sharingan."
                },
                rocklee: {
                    id: "rocklee", name: "Rock Lee", clan: "folha", element: "Nenhum",
                    title: "O Gênio do Taijutsu", color: "#2fa84f",
                    signature: { name: "Lótus Primária", cardId: "taijutsu003", desc: "Sequência de golpes devastadora, com custo para si mesmo." },
                    jutsu: { cardId: "taijutsu003", cost: 40, attack: 60, element: "Nenhum", power: 75, effect: "self_damage" },
                    baseAttributes: { forca: 10, agilidade: 9, chakra: 3, vitalidade: 8, controle: 4 },
                    startCards: ["taijutsu003", "taijutsu001", "taijutsu001", "taijutsu002", "mode002"],
                    desc: "Não usa ninjutsu nem genjutsu, mas supera limites com puro taijutsu."
                },
                neji: {
                    id: "neji", name: "Neji Hyuga", clan: "folha", element: "Vento",
                    title: "O Prodígio do Byakugan", color: "#c9b98a",
                    signature: { name: "Punho Suave", cardId: "debuff001", desc: "Bloqueia os pontos de chakra, reduzindo a defesa inimiga." },
                    jutsu: { cardId: "debuff001", cost: 15, attack: 0, element: "Nenhum", power: 50, effect: "reduce_defense" },
                    baseAttributes: { forca: 6, agilidade: 8, chakra: 8, vitalidade: 6, controle: 9 },
                    startCards: ["debuff001", "mode004", "taijutsu002", "item003", "item003"],
                    desc: "Vê o fluxo de chakra com o Byakugan e ataca pontos vitais com precisão."
                },
                hinata: {
                    id: "hinata", name: "Hinata Hyuga", clan: "folha", element: "Nenhum",
                    title: "A Herdeira Gentil", color: "#7b6fb0",
                    signature: { name: "Leões Gêmeos", cardId: "taijutsu002", desc: "Golpes de chakra em forma de leões gêmeos." },
                    jutsu: { cardId: "taijutsu002", cost: 15, attack: 25, element: "Nenhum", power: 45, effect: "piercing" },
                    baseAttributes: { forca: 6, agilidade: 7, chakra: 7, vitalidade: 6, controle: 8 },
                    startCards: ["taijutsu002", "mode004", "item006", "buff002"],
                    desc: "Tímida mas determinada. Domina o Punho Suave do clã Hyuga."
                },
                shikamaru: {
                    id: "shikamaru", name: "Shikamaru Nara", clan: "folha", element: "Nenhum",
                    title: "O Estrategista", color: "#5f7d5f",
                    signature: { name: "Manipulação de Sombras", cardId: "debuff002", desc: "Prende o inimigo com sombras, atrasando seu turno." },
                    jutsu: { cardId: "debuff002", cost: 15, attack: 0, element: "Nenhum", power: 45, effect: "opponent_draw_less" },
                    baseAttributes: { forca: 4, agilidade: 6, chakra: 9, vitalidade: 5, controle: 10 },
                    startCards: ["debuff002", "item004", "item004", "jutsu003", "buff002"],
                    desc: "Preguiçoso porém brilhante. Vence batalhas com estratégia, não força."
                }
            }
        },
        areia: {
            id: "areia",
            name: "Clã da Areia",
            village: "Sunagakure",
            element: "Terra",
            symbol: "\uD83C\uDFDC",
            color: "#d9a441",
            desc: "Ninjas de Sunagakure. Mestres da manipulação de areia, marionetes e vento do deserto.",
            cardPool: ["jutsu015", "jutsu006", "jutsu012", "jutsu042", "jutsu043", "jutsu044", "jutsu045", "taijutsu001", "taijutsu002", "debuff001", "item001", "item002", "item006", "item010", "armor001", "weapon001"],
            characters: {
                gaara: {
                    id: "gaara", name: "Gaara", clan: "areia", element: "Terra",
                    title: "O Jinchuuriki do Shukaku", color: "#b5543a",
                    signature: { name: "Areia Absoluta", cardId: "jutsu006", desc: "Armadura de areia que protege e repele ataques." },
                    jutsu: { cardId: "jutsu006", cost: 20, attack: 0, element: "Terra", power: 65, effect: "defense_percent" },
                    baseAttributes: { forca: 6, agilidade: 5, chakra: 10, vitalidade: 9, controle: 7 },
                    startCards: ["jutsu006", "jutsu015", "item001", "item001", "armor001"],
                    desc: "Controla a areia sem selos de mão. Sua defesa absoluta é quase impenetrável."
                },
                temari: {
                    id: "temari", name: "Temari", clan: "areia", element: "Vento",
                    title: "A Mestra do Leque", color: "#c9a94f",
                    signature: { name: "Corte de Vento", cardId: "jutsu014", desc: "Foice de vento lançada com o leque gigante." },
                    jutsu: { cardId: "jutsu014", cost: 35, attack: 40, element: "Vento", power: 60, effect: "knockback" },
                    baseAttributes: { forca: 5, agilidade: 7, chakra: 8, vitalidade: 6, controle: 8 },
                    startCards: ["jutsu014", "jutsu014", "item003", "item003", "buff002"],
                    desc: "Usa um leque gigante para conjurar rajadas de vento devastadoras."
                },
                kankuro: {
                    id: "kankuro", name: "Kankuro", clan: "areia", element: "Nenhum",
                    title: "O Mestre de Marionetes", color: "#6b5b8a",
                    signature: { name: "Marionete Karasu", cardId: "invoc001", desc: "Invoca uma marionete que ataca repetidamente." },
                    jutsu: { cardId: "invoc001", cost: 30, attack: 15, element: "Nenhum", power: 55, effect: "summon_dot" },
                    baseAttributes: { forca: 5, agilidade: 6, chakra: 8, vitalidade: 6, controle: 7 },
                    startCards: ["invoc001", "debuff001", "item001", "item004"],
                    desc: "Controla marionetes venenosas à distância com fios de chakra."
                },
                sasori: {
                    id: "sasori", name: "Sasori", clan: "areia", element: "Nenhum",
                    title: "O Mestre das Marionetes Vermelhas", color: "#a83a3a",
                    signature: { name: "Marionete Humana", cardId: "item007", desc: "Lâminas envenenadas paralisam o inimigo lentamente." },
                    jutsu: { cardId: "item007", cost: 20, attack: 0, element: "Nenhum", power: 65, effect: "poison" },
                    baseAttributes: { forca: 6, agilidade: 7, chakra: 8, vitalidade: 7, controle: 8 },
                    startCards: ["item007", "invoc001", "item001", "item004"],
                    desc: "Transformou o próprio corpo em marionete. Especialista em venenos letais."
                }
            }
        },
        nevoa: {
            id: "nevoa",
            name: "Clã da Névoa",
            village: "Kirigakure",
            element: "Água",
            symbol: "\uD83C\uDF0A",
            color: "#3a86b5",
            desc: "Ninjas de Kirigakure. Assassinos silenciosos que dominam a água e o kenjutsu.",
            cardPool: ["jutsu005", "jutsu017", "jutsu002", "jutsu012", "jutsu036", "jutsu037", "jutsu038", "jutsu039", "jutsu049", "taijutsu001", "taijutsu002", "item001", "item003", "item004", "item006", "weapon001", "armor001"],
            characters: {
                zabuza: {
                    id: "zabuza", name: "Zabuza Momochi", clan: "nevoa", element: "Água",
                    title: "O Demônio da Névoa", color: "#4a6b7a",
                    signature: { name: "Dragão de Água", cardId: "jutsu005", desc: "Invoca um dragão de água que devasta o campo." },
                    jutsu: { cardId: "jutsu005", cost: 40, attack: 50, element: "Água", power: 70, effect: "knockback" },
                    baseAttributes: { forca: 8, agilidade: 7, chakra: 7, vitalidade: 8, controle: 6 },
                    startCards: ["jutsu005", "taijutsu002", "weapon001", "item001", "item004"],
                    desc: "Assassino da espada Kubikiribocho. Especialista em névoa e execução silenciosa."
                },
                haku: {
                    id: "haku", name: "Haku", clan: "nevoa", element: "Água",
                    title: "O Espelho de Gelo", color: "#8fd0e8",
                    signature: { name: "Espelhos Demoníacos de Gelo", cardId: "jutsu017", desc: "Move-se entre espelhos de gelo e ataca em velocidade impossível." },
                    jutsu: { cardId: "jutsu017", cost: 40, attack: 50, element: "Água", power: 65, effect: "multi_hit" },
                    baseAttributes: { forca: 4, agilidade: 10, chakra: 8, vitalidade: 5, controle: 9 },
                    startCards: ["jutsu017", "item003", "item003", "item004", "buff002"],
                    desc: "Usa o kekkei genkai de gelo para atacar de dentro de espelhos."
                },
                kisame: {
                    id: "kisame", name: "Kisame Hoshigaki", clan: "nevoa", element: "Água",
                    title: "O Monstro da Névoa", color: "#3a7a9a",
                    signature: { name: "Bomba Tubarão", cardId: "jutsu017", desc: "Massa de água em forma de tubarão que arrasta o inimigo." },
                    jutsu: { cardId: "jutsu017", cost: 40, attack: 50, element: "Água", power: 72, effect: "chakra_drain" },
                    baseAttributes: { forca: 9, agilidade: 6, chakra: 9, vitalidade: 9, controle: 5 },
                    startCards: ["jutsu017", "jutsu005", "weapon001", "item001", "item001"],
                    desc: "Empunha a Samehada, que devora chakra. Chakra colossal comparável a um Bijuu."
                },
                suigetsu: {
                    id: "suigetsu", name: "Suigetsu Hozuki", clan: "nevoa", element: "Água",
                    title: "O Demônio de Água", color: "#4f9ec4",
                    signature: { name: "Hidrificação", cardId: "item004", desc: "Transforma o corpo em água, esquivando e reduzindo o dano recebido." },
                    jutsu: { cardId: "item004", cost: 10, attack: 0, element: "Água", power: 55, effect: "reduce_next_enemy_attack_percent" },
                    baseAttributes: { forca: 7, agilidade: 8, chakra: 7, vitalidade: 7, controle: 6 },
                    startCards: ["item004", "item004", "taijutsu002", "weapon001", "item001"],
                    desc: "Seu corpo é feito de água. Busca as sete espadas lendárias da Névoa."
                }
            }
        },
        nuvem: {
            id: "nuvem",
            name: "Clã da Nuvem",
            village: "Kumogakure",
            element: "Raio",
            symbol: "\u26A1",
            color: "#e0c341",
            desc: "Ninjas de Kumogakure. Velocidade e poder elétrico incomparáveis.",
            cardPool: ["jutsu002", "jutsu016", "jutsu019", "jutsu020", "jutsu047", "jutsu048", "taijutsu001", "taijutsu003", "buff003", "item001", "item002", "item010", "armor001", "weapon001"],
            characters: {
                killerbee: {
                    id: "killerbee", name: "Killer Bee", clan: "nuvem", element: "Raio",
                    title: "O Jinchuuriki do Gyuki", color: "#c9a83a",
                    signature: { name: "Lariat de Raio", cardId: "jutsu016", desc: "Golpe elétrico em alta velocidade com oito espadas." },
                    jutsu: { cardId: "jutsu016", cost: 45, attack: 55, element: "Raio", power: 75, effect: "stun" },
                    baseAttributes: { forca: 9, agilidade: 8, chakra: 10, vitalidade: 9, controle: 5 },
                    startCards: ["jutsu016", "taijutsu003", "weapon001", "item001", "item010"],
                    desc: "Rapper e espadachim. Controla perfeitamente o poder do Oito Caudas."
                },
                ei: {
                    id: "ei", name: "Quarto Raikage (A)", clan: "nuvem", element: "Raio",
                    title: "O Raikage", color: "#8a8f30",
                    signature: { name: "Armadura de Raio", cardId: "jutsu020", desc: "Reveste-se de relâmpago, aumentando velocidade e poder de perfuração." },
                    jutsu: { cardId: "jutsu020", cost: 35, attack: 45, element: "Raio", power: 78, effect: "ignore_defense_value" },
                    baseAttributes: { forca: 10, agilidade: 8, chakra: 8, vitalidade: 9, controle: 4 },
                    startCards: ["jutsu020", "jutsu016", "taijutsu001", "item001", "item002"],
                    desc: "Força física imensa e a Armadura de Raio. O líder mais rápido de Kumogakure."
                },
                darui: {
                    id: "darui", name: "Darui", clan: "nuvem", element: "Raio",
                    title: "A Mão Esquerda do Raikage", color: "#7a8fa0",
                    signature: { name: "Tigre de Raio", cardId: "jutsu016", desc: "Dispara um tigre elétrico contra o inimigo." },
                    jutsu: { cardId: "jutsu016", cost: 45, attack: 55, element: "Raio", power: 68, effect: "piercing" },
                    baseAttributes: { forca: 7, agilidade: 7, chakra: 8, vitalidade: 7, controle: 7 },
                    startCards: ["jutsu016", "jutsu019", "item001", "item003", "buff003"],
                    desc: "Combina Estilo Raio e Estilo Água com destreza. Sucessor do Raikage."
                }
            }
        },
        pedra: {
            id: "pedra",
            name: "Clã da Pedra",
            village: "Iwagakure",
            element: "Terra",
            symbol: "\uD83E\uDEA8",
            color: "#a06a3a",
            desc: "Ninjas de Iwagakure. Robôs humanos: resistentes, explosivos e implacáveis.",
            cardPool: ["jutsu015", "jutsu006", "jutsu042", "jutsu043", "jutsu044", "jutsu045", "jutsu012", "taijutsu001", "taijutsu002", "taijutsu003", "item005", "item001", "item002", "item010", "armor001", "armor002", "weapon001"],
            characters: {
                deidara: {
                    id: "deidara", name: "Deidara", clan: "pedra", element: "Terra",
                    title: "O Artista Bomba", color: "#c9a24a",
                    signature: { name: "Argila Explosiva", cardId: "item005", desc: "Modela argila que explode ao contato. A arte é uma explosão!" },
                    jutsu: { cardId: "item005", cost: 15, attack: 25, element: "Fogo", power: 70, effect: "area_attack" },
                    baseAttributes: { forca: 5, agilidade: 8, chakra: 9, vitalidade: 6, controle: 7 },
                    startCards: ["item005", "item005", "item001", "item003", "buff002"],
                    desc: "Membro da Akatsuki. Usa argila explosiva moldada pela boca nas mãos."
                },
                onoki: {
                    id: "onoki", name: "Onoki", clan: "pedra", element: "Terra",
                    title: "O Tsuchikage", color: "#8a6a4a",
                    signature: { name: "Poeira Explosiva", cardId: "jutsu015", desc: "Desintegra tudo que toca com partículas de poeira." },
                    jutsu: { cardId: "jutsu015", cost: 30, attack: 40, element: "Terra", power: 76, effect: "ignore_defense" },
                    baseAttributes: { forca: 5, agilidade: 6, chakra: 10, vitalidade: 6, controle: 9 },
                    startCards: ["jutsu015", "jutsu006", "item001", "item002", "armor001"],
                    desc: "O Tsuchikage. Domina o Kekkei Tota de Poeira explosiva e manipula peso."
                },
                kurotsuchi: {
                    id: "kurotsuchi", name: "Kurotsuchi", clan: "pedra", element: "Terra",
                    title: "A Princesa da Pedra", color: "#6a5a7a",
                    signature: { name: "Lança de Pedra", cardId: "jutsu015", desc: "Ergue lanças de pedra do solo para empalar o inimigo." },
                    jutsu: { cardId: "jutsu015", cost: 30, attack: 40, element: "Terra", power: 62, effect: "piercing" },
                    baseAttributes: { forca: 6, agilidade: 6, chakra: 7, vitalidade: 7, controle: 7 },
                    startCards: ["jutsu015", "jutsu006", "item001", "item005", "item006"],
                    desc: "Neta do Tsuchikage. Combina Estilo Terra e Estilo Água com talento."
                }
            }
        },
        akatsuki: {
            id: "akatsuki",
            name: "Akatsuki",
            village: "Organização Renegada",
            element: "Fogo",
            symbol: "\u2601",
            color: "#b5323a",
            desc: "Organização de ninjas renegados de elite. Poder absoluto sem lealdade a vilas.",
            cardPool: ["jutsu008", "jutsu018", "jutsu010", "jutsu009", "jutsu002", "jutsu013", "jutsu033", "jutsu034", "jutsu035", "jutsu051", "jutsu052", "jutsu053", "jutsu054", "debuff001", "debuff002", "debuff003", "item001", "item007", "item008", "armor001"],
            characters: {
                itachi: {
                    id: "itachi", name: "Itachi Uchiha", clan: "akatsuki", element: "Fogo",
                    title: "O Mestre do Sharingan", color: "#7a3a5a",
                    signature: { name: "Amaterasu", cardId: "jutsu008", desc: "Chama negra inextinguível que queima por vários turnos." },
                    jutsu: { cardId: "jutsu008", cost: 55, attack: 30, element: "Fogo", power: 80, effect: "burn" },
                    baseAttributes: { forca: 5, agilidade: 8, chakra: 10, vitalidade: 5, controle: 10 },
                    startCards: ["jutsu008", "jutsu013", "jutsu013", "item003", "buff003"],
                    desc: "Gênio do clã Uchiha. Domina Amaterasu, Tsukuyomi e o Susanoo."
                },
                pain: {
                    id: "pain", name: "Pain (Tendo)", clan: "akatsuki", element: "Vento",
                    title: "O Deus da Chuva", color: "#a05a4a",
                    signature: { name: "Shinra Tensei", cardId: "jutsu009", desc: "Repulsa divina que bloqueia e rejeita todo ataque." },
                    jutsu: { cardId: "jutsu009", cost: 50, attack: 0, element: "Nenhum", power: 85, effect: "block_all_damage" },
                    baseAttributes: { forca: 5, agilidade: 7, chakra: 10, vitalidade: 6, controle: 10 },
                    startCards: ["jutsu009", "jutsu010", "item001", "item002", "item010"],
                    desc: "Líder da Akatsuki. Controla os seis corpos de Pain e o Rinnegan."
                },
                konan: {
                    id: "konan", name: "Konan", clan: "akatsuki", element: "Vento",
                    title: "O Anjo de Papel", color: "#6a5a9a",
                    signature: { name: "Dança dos Shikigami", cardId: "debuff003", desc: "Enxame de papel que confunde e fere o inimigo." },
                    jutsu: { cardId: "debuff003", cost: 20, attack: 0, element: "Nenhum", power: 60, effect: "enemy_attack_fail_chance" },
                    baseAttributes: { forca: 4, agilidade: 9, chakra: 9, vitalidade: 5, controle: 9 },
                    startCards: ["debuff003", "debuff003", "item003", "item003", "buff002"],
                    desc: "Seu corpo pode se fragmentar em milhares de folhas de papel explosivo."
                },
                orochimaru: {
                    id: "orochimaru", name: "Orochimaru", clan: "akatsuki", element: "Terra",
                    title: "O Sannin das Serpentes", color: "#5a7a5a",
                    signature: { name: "Invocação: Serpente", cardId: "invoc001", desc: "Invoca Manda e serpentes que atacam com veneno." },
                    jutsu: { cardId: "invoc001", cost: 30, attack: 15, element: "Nenhum", power: 72, effect: "summon_dot" },
                    baseAttributes: { forca: 6, agilidade: 7, chakra: 10, vitalidade: 6, controle: 9 },
                    startCards: ["invoc001", "item007", "debuff001", "item001", "item008"],
                    desc: "Sannin obcecado pela imortalidade. Mestre de jutsus proibidos e venenos."
                },
                hidan: {
                    id: "hidan", name: "Hidan", clan: "akatsuki", element: "Nenhum",
                    title: "O Imortal Fanático", color: "#8a3a3a",
                    signature: { name: "Ritual de Jashin", cardId: "taijutsu003", desc: "Fere a si mesmo para ferir o inimigo através do ritual." },
                    jutsu: { cardId: "taijutsu003", cost: 40, attack: 60, element: "Nenhum", power: 74, effect: "self_damage" },
                    baseAttributes: { forca: 9, agilidade: 7, chakra: 4, vitalidade: 10, controle: 5 },
                    startCards: ["taijutsu003", "item001", "item001", "item008"],
                    desc: "Imortal devoto de Jashin. Causa sua própria dor ao inimigo com sua foice tripla."
                }
            }
        }
    };

    // Estatísticas derivadas de atributos (usadas no combate).
    function deriveStats(clanId, charId, attributes) {
        const a = attributes || {};
        const forca = a.forca || 5;
        const agilidade = a.agilidade || 5;
        const chakra = a.chakra || 5;
        const vitalidade = a.vitalidade || 5;
        const controle = a.controle || 5;
        return {
            maxHealth: 400 + vitalidade * 15,
            maxChakra: 300 + chakra * 18,
            maxDefense: 60 + Math.round((forca + controle) * 1.5),
            attackBonus: forca * 2,
            jutsuBonus: chakra * 2,
            dodgeChance: Math.min(0.55, agilidade * 0.03),
            accuracy: Math.min(0.95, 0.70 + controle * 0.02),
            critChance: Math.min(0.50, 0.05 + agilidade * 0.015)
        };
    }

    function totalBaseAttributes(char) {
        const sum = { forca: 0, agilidade: 0, chakra: 0, vitalidade: 0, controle: 0 };
        if (char && char.baseAttributes) {
            for (const k in sum) sum[k] = char.baseAttributes[k] || 0;
        }
        return sum;
    }

    // Estado da sessão de criação (em memória).
    const creationState = {
        active: false,
        step: "clan", // clan | character | attributes | shop | review
        clanId: null,
        charId: null,
        attributes: { forca: 0, agilidade: 0, chakra: 0, vitalidade: 0, controle: 0 },
        points: ATTR_POINTS_CREATION,
        jutsuPicks: [] // jutsus escolhidos (até 5, diferentes, exceto o principal)
    };

    // Personagem criado e confirmado.
    const STORAGE_KEY = "narutoCard_character_v1";
    let createdCharacter = null;

    function saveCreated(character) {
        try {
            if (!character) { localStorage.removeItem(STORAGE_KEY); return; }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
        } catch (e) { /* localStorage indisponível */ }
    }

    function loadCreated() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.clanId || !parsed.attributes) return null;
            return parsed;
        } catch (e) { return null; }
    }

    function clearCreated() {
        createdCharacter = null;
        saveCreated(null);
    }

    const CharacterCreator = {
        ATTR_POINTS_CREATION,
        ATTR_POINTS_PER_LEVEL,
        STARTING_COINS,
        ATTRIBUTE_DEFS,
        clans,
        creationState,
        deriveStats,
        totalBaseAttributes,
        STORAGE_KEY,
        saveCreated,
        loadCreated,
        clearCreated,
        getCreated: () => createdCharacter || (createdCharacter = loadCreated()),
        setCreated: (c) => { createdCharacter = c; saveCreated(c); },
        getClan: (clanId) => clans[clanId] || null,
        getCharacter: (clanId, charId) => (clans[clanId] && clans[clanId].characters[charId]) || null,
        reset: () => {
            creationState.active = true;
            creationState.step = "clan";
            creationState.clanId = null;
            creationState.charId = null;
            creationState.attributes = { forca: 0, agilidade: 0, chakra: 0, vitalidade: 0, controle: 0 };
            creationState.points = ATTR_POINTS_CREATION;
            creationState.jutsuPicks = [];
        }
    };

    window.NarutoCharacter = CharacterCreator;
})();
