/*!
 * 尾行 · 酒馆助手整合脚本 v0.7（引擎＋胶水＋原生嵌入状态栏，一条粘完即用）
 * 安装：酒馆助手 → 脚本 → 角色卡脚本 → 新建 → 粘贴本文件全文 → 启用。
 * 嵌入特性：纯原生 DOM 无 iframe、无滑块、直接嵌入输入栏 #form_sheld，心跳卡片与抽屉向上弹出不遮挡输入。
 */
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/config/rules.json
  var require_rules = __commonJS({
    "src/config/rules.json"(exports, module) {
      module.exports = {
        checks: {
          follow: 13,
          withdraw: 10,
          hide: 12,
          fake_call: 12,
          shop_enter: 13,
          record: 13,
          plate: 13,
          trash: 12,
          pick: 16,
          perch: 12,
          listen_home: 14,
          photo: 13,
          scan: 12,
          deduce: 12,
          timing: 15,
          listen: 13,
          greet: 11,
          chat: 13,
          ease: 13,
          barrier: 14,
          pry: 16,
          climb: 14,
          drag: 10,
          stakeout: 15,
          locate: 13,
          mailbox: 12,
          camera: 12,
          door: 12,
          lurk: 14,
          dlisten: 14,
          peep: 15,
          handle: 13,
          lockpick: 18,
          ransack: 13,
          bug: 15,
          tracks: 14,
          exit: 12,
          transfer: 14,
          peers: 13,
          visit: 15,
          audit: 13,
          lobby: 14,
          apply: 17,
          desk: 14,
          gossip: 15,
          social: 12,
          gps: 15,
          parcel: 13,
          number: 14,
          pump: 14,
          guard: 13,
          stage: 15,
          brace: 14,
          grope: 16,
          escalate: 18,
          shift: 12,
          ride_follow: 13,
          car_follow: 12,
          alight_follow: 13
        },
        check: {
          graceMargin: 3,
          graceIds: [
            "follow",
            "enter_tail",
            "ride_along",
            "withdraw",
            "hide",
            "fake_call",
            "shop_enter",
            "lurk",
            "lobby",
            "stakeout",
            "ride_follow",
            "car_follow",
            "transfer",
            "photo",
            "scan",
            "listen"
          ],
          sweetBonus: 1,
          sweetLow: 40,
          sweetHigh: 65,
          coverCap: 5,
          identifyMemCoeff: 0.05,
          identifyMemMax: 1
        },
        advantage: {
          piThreshold: 60,
          attrThreshold: 10,
          sweetHighBonus: 5,
          note: "\u4F18\u52BF\u4E94\u6807\u7B7E\uFF08\u4E3B\u4EBA\u5B9A\u7A3F 2026-10-16\uFF09\uFF1A\u7D2F\u8BA1PI\u226560\u6302[\u4F18\u52BF:\u60C5\u62A5]\uFF1Bstr/agi/cha\u226510\u6302\u5404\u81EA\u5C5E\u6027\u4F18\u52BF\uFF1Bnrv\u226510\u6302[\u4F18\u52BF:\u80C6\u91CF]\u751C\u533A\u4E0A\u9650+5\u3002\u6548\u679C=\u8BE5\u5C5E\u60271d20\u68C0\u5B9A\u5355\u9AB0\u53D8\u53CC\u9AB0\uFF0C\u5929\u7136\u94C1\u5F8B\uFF1A\u670920\u5FC5\u53D620(\u542B{1,20})\u3001\u65E020\u67091\u9501\u6B7B\u53D61\u3001\u5426\u5219\u53D6\u9AD8\u3002\u51B2\u7A81\u5BF9\u6297(2d10)\u4E0D\u5403\u4F18\u52BF\u3002\u52A3\u52BF\u4FA7\u4E0D\u5B9E\u88C5\u3002"
        },
        stamina: {
          segTax: { calm: 1, sweet: 2, deform: 4, crash: 6 },
          nightRest: { fullMin: 0.3, midMin: 0.1, midTo: 0.8, lowTo: 0.6 }
        },
        heart: {
          cap: 100,
          coeffBase: 1.4,
          coeffPerNrv: 0.08,
          stim: {
            none: 0,
            lowMin: 5,
            lowMax: 10,
            midMin: 10,
            midMax: 20,
            highMin: 25,
            highMax: 35,
            pump: {
              tail: { far: 5, same: 8, close: 12, touch: 16 },
              lost: 5,
              exposed: 28,
              social: 5,
              env: { cat: 10, dog: 18 },
              familiarEnvFactor: 0.5,
              calmSocialProximity: 60
            }
          },
          baseline: 30,
          deformLine: 70,
          crashLine: 90,
          breathBase: 10,
          breathPerNrv: 2,
          breathMin: 6,
          segDrop: 5,
          floor: 20,
          areaFamiliarSegments: 10
        },
        alert: {
          threat: { minor: 3, medium: 8, major: 20 },
          distFactor: { far: 0.5, same: 0.8, close: 1.2, touch: 1.8 },
          envFactor: { rainNight: 0.7, night: 0.9, day: 1, open: 1.4 },
          acuityBase: 0.8,
          acuityPer: 0.04,
          bands: { uneasy: 21, suspicious: 41, confirmed: 61, react: 81 },
          nightBase: { e18_21: 0, e21_23: 10, e23_01: 20, late: 30 },
          familiarCoeff: 0.8
        },
        conflict: {
          strWeight: 3,
          agiWeight: 2,
          oppMods: [-15, -10, -5, 0, 5, 10],
          firstStrike: 5,
          alertStageBonus: 2,
          highHeartLine: 80,
          highHeartPenalty: -3,
          bands: { pin: 20, scuffle: 5, grindLow: -4 },
          femaleCopTraining: 5,
          struggleEscapeMax: 3,
          struggleDashDiff: 5,
          struggleDC: 25,
          freezeDC: 13,
          hesitationMods: [-10, -5]
        },
        chase: {
          startGap: 3,
          loseGap: 5,
          dashDiff: 5,
          staminaPerRound: 6,
          herStaminaPerStr: 10,
          terrainBonus: 2
        },
        identity: {
          pointBuy: 20,
          fence: { base: 0.6, criminal: 0.75 },
          blackMarketDiscount: 0.1,
          jobs: {
            coach_class: { name: "\u79C1\u6559\u8BFE", attr: "str", exclusive: "coach", base: 300, pass: 450, great: 600, cost: { stamina: 20 }, nativeMult: 1.2 },
            black_labor: { name: "\u9ED1\u5DE5", attr: "str", exclusive: "criminal", baseJob: "mover", mult: 0.7 }
          },
          list: {
            student: {
              id: "student",
              name: "\u5B66\u751F",
              mods: { agi: 1, int: 1 },
              freePass: ["school_gate_b", "school_bus_terminal_b"],
              tags: [],
              desc: "\u6587\u6559\u533A\u95E8\u7981\u514D\u68C0\uFF1B\u65E0\u672C\u804C\u5DE5\u79CD\uFF08\u96F6\u5DE5\u539F\u4EF7\uFF09\uFF0C\u6B63\u9762\u4E0D\u5F3A\u4E0D\u5E26\u8D1F\u9762"
            },
            criminal: {
              id: "criminal",
              name: "\u7F6A\u72AF",
              mods: { str: 1, agi: 1, nrv: 2 },
              freePass: [],
              tags: ["criminal_look", "criminal_blunt"],
              job: "black_labor",
              fence: "criminal",
              blackMarket: true,
              desc: "\u9ED1\u5E02\u5668\u6750-10%\uFF1B\u9500\u8D430.75\uFF1B\u9ED1\u5DE5=\u642C\u573A\xD70.7\uFF1B\u6302\u76F8\u906E\u853D-2\uFF1B\u65E0\u4E1A\u9762\u793E\u4EA4-2"
            },
            guard: {
              id: "guard",
              name: "\u4FDD\u5B89",
              mods: { str: 1, nrv: 1 },
              freePass: ["office_lobby_a", "parking_b2_a", "unit_stairs_b"],
              tags: [],
              shiftRotation: { order: ["day", "night"] },
              desc: "\u7269\u4E1A\u5B89\u4FDD\u4F53\u7CFB\u514D\u68C0\uFF08D\u533A\u522B\u5885\u4E0D\u8BA4\uFF09\uFF1B\u4FDD\u5B89\u5F53\u73ED320\u56FA\u5B9A\u672C\u804C384\uFF1B\u6392\u73ED\u5468\u8F6E\u6362\u663C\u2192\u591C=floor((date-1)/7)mod2"
            },
            detective: {
              id: "detective",
              name: "\u4FA6\u63A2\u5B66\u5F92",
              mods: { int: 1, agi: 1, cha: 1 },
              freePass: [],
              tags: [],
              piMult: 1.2,
              ocd: true,
              desc: "PI\xD71.2\uFF08\u5F53\u665A\u6BDB\u5165\u8D26\u8FC7\u591C\u8865\u5DEEround(\xD70.2)\uFF09\uFF1B\u59D4\u6258\u4F63\u91D1200~400\uFF1B\u804C\u4E1A\u75C5=\u8DDF\u7F00\u4E2D\u6536\u624B\u9501\u6B7B"
            },
            bartender: {
              id: "bartender",
              name: "\u9152\u4FDD",
              mods: { cha: 2, nrv: 1 },
              freePass: ["club_backdoor_c", "food_street_c"],
              tags: [],
              deepNightMissSegments: 2,
              desc: "C\u533A\u591C\u573A\u514D\u68C0\uFF1B\u9152\u5427\u5F53\u73ED\u672C\u804C360/468+\u5C0F\u8D391d10x10\uFF1B\u5F53\u73ED\u591C\u9519\u8FC7\u5979\u52A8\u7EBF\u524D2\u6BB5"
            },
            coach: {
              id: "coach",
              name: "\u5065\u8EAB\u6559\u7EC3",
              mods: { str: 3, cha: 1 },
              freePass: [],
              tags: ["coach_bulk"],
              gymProximity: 20,
              apMod: -1,
              job: "coach_class",
              desc: "\u76EE\u6807\u65E5\u7A0B\u542B\u5065\u8EAB\u623F\u2192\u63A5\u8FD1\u5EA6\u8D77\u70B9+20\uFF08facts tags\u767D\u540D\u5355gym\uFF09\uFF1B\u79C1\u6559\u8BFE\u672C\u804C360/540/720\uFF1B\u5927\u5757\u5934\u906E\u853D-2\uFF1B\u6BCF\u65E5\u884C\u52A8\u70B9-1"
            },
            otaku: {
              id: "otaku",
              name: "\u963F\u5B85",
              mods: { int: 1, cha: 1 },
              freePass: [],
              tags: [],
              startKit: { item: "cam_storage", value: 800 },
              desc: "\u5F00\u5C40\u81EA\u5E26\u9488\u5B54\u6444\u50CF\u673A\uFF08\u5B58\u50A8\u6863\uFF0C\u7B49\u503C800\uFF0C\u7269\u54C1\u7CFB\u7EDF\u843D\u4F4D\u540E\u5165\u5305\uFF09\uFF1B\u8FDC\u7A0B\u63A5\u5355\u672C\u804C264/370/528+\u88AB\u52A8150/\u5929"
            }
          }
        },
        targets: {
          list: {
            ol: {
              id: "ol",
              name: "\u75B2\u60EB\u7684OL",
              difficulty: 2,
              stars: "\u2605\u2605\u2606\u2606\u2606",
              type: "\u75B2\u60EB\u730E",
              area: "\u4E2D\u57CECBD \u2794 \u8001\u57CE\u6587\u6559\u533A",
              tagline: "\u5199\u5B57\u697C\u6DF1\u591C\u52A0\u5B8C\u73ED\uFF0C\u9AD8\u8DDF\u978B\u6572\u6253\u5728\u8001\u57CE\u591C\u96E8\u91CC",
              features: "\u6DF1\u591C\u52A0\u73ED\u7A97\u53E3 \xB7 [\u75B2\u60EB] \u654F\u9510\u964D\u4F4E \xB7 \u9AD8\u8DDF\u978B\u6B65\u9891\u6E05\u8106",
              windowNote: "\u5DE5\u4F5C\u65E5 21:00 \u8D77\u4E0B\u73ED\uFF0C\u75B2\u60EB\u4E0B\u9632\u5907\u8F83\u4F4E\uFF0C\u4F46\u52A8\u7EBF\u8DE8\u533A\u8F83\u957F",
              shoe: "shoe_heel",
              stats: { str: 3, agi: 5, per: 6, nrv: 4 },
              social: 2,
              alertMod: 5,
              status: "ready"
            },
            college: {
              id: "college",
              name: "\u72EC\u5C45\u5973\u5927\u5B66\u751F",
              difficulty: 2,
              stars: "\u2605\u2605\u2606\u2606\u2606",
              type: "\u6807\u51C6\u6559\u79D1\u4E66",
              area: "\u8001\u57CE\u6587\u6559\u533A",
              tagline: "\u665A\u5F52\u7684\u5355\u8F66\u505C\u5728\u697C\u4E0B\uFF0C\u8033\u673A\u91CC\u653E\u7740\u4E0D\u5173\u7684\u97F3\u4E50",
              features: "\u6821\u5916\u79DF\u623F\u72EC\u5C45 \xB7 \u8BFE\u8868\u534A\u56FA\u5B9A \xB7 \u6613\u5206\u5FC3",
              windowNote: "\u665A\u81EA\u4E60\u6216\u517C\u804C\u5F52\u6765\uFF0C\u72EC\u5904\u7A97\u53E3\u5927\uFF0C\u793E\u4EA4\u5708\u5355\u7EAF",
              shoe: "shoe_sneakers",
              stats: { str: 3, agi: 4, per: 4, nrv: 4 },
              social: 2,
              alertMod: 0,
              status: "ready"
            },
            student: {
              id: "student",
              name: "\u665A\u81EA\u4E60\u9AD8\u4E2D\u751F",
              difficulty: 2,
              stars: "\u2605\u2605\u2606\u2606\u2606",
              type: "\u7A97\u53E3\u730E",
              area: "\u8001\u57CE\u6587\u6559\u533A",
              tagline: "\u6C89\u91CD\u7684\u4E66\u5305\u538B\u7740\u53CC\u80A9\uFF0C\u653E\u5B66\u8DEF\u53EA\u6709\u6700\u540E\u4E00\u6BB5\u72EC\u884C",
              features: "\u653E\u5B66\u7ED3\u4F34\u7387\u9AD8 \xB7 \u72EC\u5904\u7A97\u53E3\u7A00\u7F3A \xB7 \u65E5\u7A0B\u6781\u56FA\u5B9A",
              windowNote: "\u5E73\u65E5\u540C\u884C\u4EBA\u591A\u96BE\u4EE5\u4E0B\u624B\uFF0C\u8865\u4E60\u665A\u5F52\u6216\u72EC\u81EA\u503C\u65E5\u662F\u552F\u4E00\u7A97\u53E3",
              shoe: "shoe_leather",
              stats: { str: 2, agi: 4, per: 4, nrv: 3 },
              social: 1,
              alertMod: -5,
              status: "ready"
            },
            club: {
              id: "club",
              name: "\u591C\u5E97\u5C0F\u59D0",
              difficulty: 3,
              stars: "\u2605\u2605\u2605\u2606\u2606",
              type: "\u53CC\u6001\u730E",
              area: "\u4E34\u6C5F\u5A31\u4E50\u7EA2\u706F\u533A",
              tagline: "\u540E\u95E8\u6563\u573A\u65F6\u7684\u51B7\u98CE\u5439\u9192\u4E86\u9152\u610F\uFF0C\u5305\u91CC\u85CF\u7740\u672A\u62C6\u5C01\u7684\u55B7\u96FE",
              features: "\u53CC\u6001\u5207\u6362 \xB7 \u9189\u6001\u8FDF\u7F13/\u9192\u6001\u654F\u9510 \xB7 \u51CC\u6668\u7A7A\u65F7\u8857\u533A",
              windowNote: "\u51CC\u6668 02:00 \u540E\u4E0B\u73ED\uFF0C\u8857\u9762\u7A7A\u65F7\uFF0C\u6E05\u9192\u65F6\u53CD\u4FA6\u5BDF\u610F\u8BC6\u6781\u9AD8",
              shoe: "shoe_boots",
              stats: { str: 3, agi: 4, per: 7, nrv: 6 },
              social: 3,
              alertMod: 0,
              status: "ready"
            },
            wife: {
              id: "wife",
              name: "\u72EC\u5C45\u4EBA\u59BB",
              difficulty: 4,
              stars: "\u2605\u2605\u2605\u2605\u2606",
              type: "\u767D\u663C\u730E",
              area: "\u90CA\u91CE\u8C6A\u5B85\u533A / \u8001\u57CE\u4F4F\u5B85\u533A",
              tagline: "\u9501\u597D\u9662\u95E8\u7684\u90A3\u4E00\u523B\uFF0C\u504C\u5927\u7684\u5BA2\u5385\u53EA\u5269\u7535\u89C6\u7684\u8367\u5149",
              features: "\u767D\u663C\u4E0D\u8BBE\u9632 \xB7 \u4E08\u592B\u7B2C\u4E09\u65B9\u98CE\u9669 \xB7 \u5B9A\u4F4D\u5171\u4EAB",
              windowNote: "\u767D\u5929\u5BB6\u4E2D\u662F\u4E0D\u8BBE\u9632\u7A97\u53E3\uFF1B\u4F46\u4E08\u592B\u968F\u65F6\u53EF\u80FD\u6298\u8FD4\uFF0C\u53CC\u65E5\u7A0B\u535A\u5F08",
              shoe: "shoe_slippers",
              stats: { str: 3, agi: 3, per: 5, nrv: 4 },
              social: 4,
              alertMod: 0,
              status: "ready"
            },
            police: {
              id: "police",
              name: "\u4FBF\u8863\u5973\u5211\u8B66",
              difficulty: 5,
              stars: "\u2605\u2605\u2605\u2605\u2605",
              type: "\u9AD8\u5371BOSS",
              area: "\u5168\u57CE\u673A\u52A8",
              tagline: "\u8B66\u60D5\u7684\u76EE\u5149\u63A0\u8FC7\u6BCF\u4E00\u5904\u53CD\u5149\uFF0C\u6307\u8282\u5728\u8896\u53E3\u4E0B\u5FAE\u5FAE\u63E1\u7D27",
              features: "\u6218\u672F\u53CD\u4FA6\u5BDF \xB7 \u654F\u9510\u76F4\u89C9 \xB7 \u51B2\u7A81\u4E13\u4E1A\u683C\u6597\u53CD\u5236",
              windowNote: "\u65E5\u7A0B\u56DB\u73ED\u4E09\u5012\u6781\u96BE\u638C\u63E1\uFF0C\u55C5\u89C9\u654F\u9510\uFF0C\u7A0D\u6709\u4E0D\u614E\u5373\u906D\u53CD\u9501\u6263\u62BC",
              shoe: "shoe_leather",
              stats: { str: 6, agi: 7, per: 8, nrv: 9 },
              social: 4,
              alertMod: 15,
              status: "ready"
            }
          },
          generator: {
            namePool: {
              surnames: ["\u6797", "\u6C88", "\u82CF", "\u987E", "\u9646", "\u59DC", "\u53F6", "\u767D", "\u7A0B", "\u6E29"],
              givenNames: [
                "\u5E7C\u5FAE",
                "\u665A\u79CB",
                "\u8BD7\u6DB5",
                "\u8BED\u68E0",
                "\u51DD\u96EA",
                "\u6C90\u6674",
                "\u82B7\u82E5",
                "\u695A\u695A",
                "\u4F9D\u8BFA",
                "\u4F73\u5B81",
                "\u6653\u590F",
                "\u5FF5\u6148",
                "\u5A49\u6E05",
                "\u662D\u534E",
                "\u4E91\u8212",
                "\u68A6\u7476",
                "\u4F69\u7476",
                "\u5E0C\u8A00",
                "\u51CC\u8587",
                "\u5FC3\u8BFA"
              ]
            },
            personalityPool: [
              { id: "stubborn", name: "\u8981\u5F3A", label: "\u8981\u5F3A", type: "personality", tagId: "stubborn", category: "conflict", value: 1, desc: "\u3010\u6027\u683C\xB7\u8981\u5F3A\u3011\u81EA\u5C0A\u901E\u5F3A\uFF0C\u5BDF\u89C9\u5F02\u6837\u5FEB\u6B65\u4E0D\u793A\u5F31\uFF0C\u51B2\u7A81\u5BF9\u6297\u4F53\u683C +1" },
              { id: "vigilant", name: "\u8B66\u60D5", label: "\u8B66\u60D5", type: "personality", tagId: "vigilant", category: "acuity", value: 1, desc: "\u3010\u6027\u683C\xB7\u8B66\u60D5\u3011\u5BF9\u5F02\u54CD\u76F4\u89C9\u654F\u9510\uFF0C\u6709\u6548\u654F\u9510\u6697\u4FEE\u6B63 +1\uFF08\u8B66\u89C9\u589E\u91CF\u591A4%\uFF0C\u8BC6\u8138\u7387\u63D0\u5347\uFF09" },
              { id: "casual", name: "\u968F\u6027", label: "\u968F\u6027", type: "personality", tagId: "casual", category: "stealth", value: 2, desc: "\u3010\u6027\u683C\xB7\u968F\u6027\u3011\u968F\u548C\u6563\u6F2B\u7701\u4E8B\u81F3\u4E0A\uFF0C\u6C89\u6D78\u81EA\u8EAB\u8282\u594F\u653E\u7A7A\uFF0C\u5BF9\u52A8\u9759\u8FDF\u949D\uFF0C\u73A9\u5BB6\u9690\u853D +2" },
              { id: "timid", name: "\u80C6\u5C0F", label: "\u80C6\u5C0F", type: "personality", tagId: "timid", category: "sound", value: -5, desc: "\u3010\u6027\u683C\xB7\u80C6\u5C0F\u3011\u751F\u6027\u80C6\u5C0F\u6015\u4E8B\uFF0C\u53D7\u9A87\u5589\u5499\u53D1\u7D27\u547C\u6551\u5F31\uFF0C\u52A8\u9759\u58F0\u6D6A -5\uFF0C\u591A\u9009\u62E9\u907F\u8D70" },
              { id: "gentle", name: "\u6E29\u548C", label: "\u6E29\u548C", type: "personality", tagId: "gentle", category: "conflict", value: -2, desc: "\u3010\u6027\u683C\xB7\u6E29\u548C\u3011\u6027\u60C5\u6E29\u548C\u907F\u4E89\u7AEF\uFF0C\u53D7\u5236\u6613\u80A2\u4F53\u50F5\u6EDE\uFF0C\u51B2\u7A81\u9996\u8F6E\u53CD\u6297\u6218\u529B -2" },
              { id: "introverted", name: "\u5185\u5411", label: "\u5185\u5411", type: "personality", tagId: "introverted", category: "social", value: -2, desc: "\u3010\u6027\u683C\xB7\u5185\u5411\u3011\u817C\u8146\u5C11\u8A00\u907F\u751F\u4EBA\uFF0C\u4E60\u60EF\u4F4E\u5934\u72EC\u884C\u907F\u5F00\u89C6\u7EBF\uFF0C\u642D\u8BDD\u4E0E\u4EA4\u6D89\u68C0\u5B9A\u4FEE\u6B63 -2" },
              { id: "aloof", name: "\u6E05\u51B7", label: "\u6E05\u51B7", type: "personality", tagId: "aloof", category: "sound", value: -2, desc: "\u3010\u6027\u683C\xB7\u6E05\u51B7\u3011\u72EC\u6765\u72EC\u5F80\u758F\u79BB\u51B7\u6DE1\uFF0C\u72EC\u884C\u5C0F\u9053\u65E0\u63A5\u5E94\uFF0C\u52A8\u9759\u58F0\u6D6A\u521D\u503C -2" },
              { id: "cheerful", name: "\u5F00\u6717", label: "\u5F00\u6717", type: "personality", tagId: "cheerful", category: "sound", value: 3, desc: "\u3010\u6027\u683C\xB7\u5F00\u6717\u3011\u6D3B\u6CFC\u5916\u5411\u7CBE\u529B\u5145\u6C9B\uFF0C\u9047\u9669\u53CD\u5E94\u679C\u65AD\u58F0\u7EBF\u6E05\u4EAE\uFF0C\u6562\u4E8E\u547C\u6551\u8D28\u95EE\uFF0C\u58F0\u6D6A +3" },
              { id: "chic", name: "\u7231\u7F8E", label: "\u7231\u7F8E", type: "personality", tagId: "chic", category: "stealth", value: 1, desc: "\u3010\u6027\u683C\xB7\u7231\u7F8E\u3011\u6CE8\u91CD\u7A7F\u642D\u4EEA\u5BB9\uFF0C\u5E38\u5728\u6A71\u7A97\u524D\u9A7B\u8DB3\u7406\u8863\u7406\u53D1\uFF0C\u5236\u9020\u77ED\u6682\u505C\u987F\u7834\u7EFD\uFF0C\u73A9\u5BB6\u63A5\u8FD1 +1" },
              { id: "naive", name: "\u5355\u7EAF", label: "\u5355\u7EAF", type: "personality", tagId: "naive", category: "social", value: 2, desc: "\u3010\u6027\u683C\xB7\u5355\u7EAF\u3011\u5FC3\u601D\u7B80\u5355\u7F3A\u5C11\u6212\u5907\uFF0C\u8B66\u60D5\u5EFA\u7ACB\u6162\uFF0C\u642D\u8BDD\u4E0E\u95EE\u8DEF\u4EA4\u6D89\u4FEE\u6B63 +2" }
            ],
            hobbyPool: [
              { id: "film_cafe", name: "\u80F6\u7247\u63A2\u5E97", label: "\u80F6\u7247\u63A2\u5E97", type: "hobby", tagId: "window_pause", category: "stealth", value: 1, dropItem: "item_retro_cam", desc: "\u3010\u7231\u597D\xB7\u80F6\u7247\u63A2\u5E97\u3011\u5E38\u5728\u8857\u89D2\u6A71\u7A97\u505C\u987F\u53D6\u666F\uFF0C\u5C3E\u968F\u8FD1\u8EAB\u68C0\u5B9A +1\uFF1B\u968F\u8EAB\u5E26\u590D\u53E4\u5361\u7247\u673A" },
              { id: "indie_music", name: "\u5927\u8033\u9EA6", label: "\u5927\u8033\u9EA6", type: "hobby", tagId: "sound_muffled", category: "stealth", value: 1, dropItem: "item_headphone", desc: "\u3010\u7231\u597D\xB7\u5927\u8033\u9EA6\u3011\u4E60\u60EF\u6234\u5927\u8033\u9EA6\u542C\u6B4C\uFF0C\u542C\u89C9\u8FDF\u949D\uFF0C\u73A9\u5BB6\u9690\u853D +1\uFF0C\u58F0\u6D6A\u9608\u503C -3\uFF1B\u968F\u8EAB\u6234\u5934\u6234\u8033\u9EA6" },
              { id: "journal_craft", name: "\u624B\u8D26", label: "\u624B\u8D26", type: "hobby", tagId: "bag_rummage", category: "stealth", value: 1, dropItem: "item_handbook", desc: "\u3010\u7231\u597D\xB7\u624B\u8D26\u3011\u5E38\u5728\u8DEF\u53E3\u9A7B\u8DB3\u7FFB\u5305\u627E\u5F69\u58A8\u7B14\u4E0E\u7968\u636E\uFF0C\u63D0\u4F9B\u80CC\u8EAB\u7834\u7EFD\u7A97\u53E3\uFF1B\u968F\u8EAB\u5E26\u79C1\u5BC6\u624B\u8D26" },
              { id: "night_run", name: "\u9999\u6C1B", label: "\u9999\u6C1B", type: "hobby", tagId: "aroma_trace", category: "acuity", value: 0, dropItem: "item_perfume", desc: "\u3010\u7231\u597D\xB7\u9999\u6C1B\u3011\u6162\u8DD1\u66F4\u8863\u5907\u6709\u9999\u6C1B\u5C0F\u6837\uFF0C\u6563\u53D1\u5FAE\u9999\uFF0C\u8FD1\u8DDD\u79BB\u55C5\u89C9\u8BC6\u522B\u7EBF\u7D22\uFF1B\u968F\u8EAB\u5E26\u9999\u6C1B\u55B7\u96FE" },
              { id: "book_tea", name: "\u65E7\u4E66", label: "\u65E7\u4E66", type: "hobby", tagId: "bag_heavy", category: "conflict", value: -1, dropItem: "item_old_book", desc: "\u3010\u7231\u597D\xB7\u65E7\u4E66\u3011\u5E06\u5E03\u5305\u5185\u538B\u7740\u501F\u9605\u65E7\u4E66\uFF0C\u8D1F\u91CD\u62D6\u7D2F\uFF0C\u8FFD\u9010\u5954\u8DD1\u654F\u6377\u5BF9\u6297 -1\uFF1B\u968F\u8EAB\u5E26\u501F\u9605\u65E7\u4E66" },
              { id: "sketch_art", name: "\u901F\u5199", label: "\u901F\u5199", type: "hobby", tagId: "bench_still", category: "stealth", value: 2, dropItem: "item_sketchbook", desc: "\u3010\u7231\u597D\xB7\u901F\u5199\u3011\u5E38\u5728\u8DEF\u706F\u957F\u6905\u9759\u5750\u753B\u8857\u666F\uFF0C\u5904\u4E8E\u9759\u6B62\u72B6\u6001\uFF0C\u5C3E\u968F\u9760\u8FD1\u514D\u9664\u79FB\u52A8\u68C0\u5B9A\uFF1B\u968F\u8EAB\u5E26\u6C34\u5F69\u901F\u5199\u672C" }
            ],
            shoePool: {
              student_and_college: [
                { id: "shoe_sneakers", name: "\u8FD0\u52A8\u978B", label: "\u8FD0\u52A8\u978B", type: "equipment", tagId: "shoe_sneakers", desc: "\u3010\u978B\u5177\xB7\u8FD0\u52A8\u978B\u3011\u8F6F\u80F6\u5E95\u7403\u978B\uFF0C\u89E6\u5730\u9759\u97F3\u5FAE\u6293\u5730\u6469\u64E6\uFF0C\u9A71\u52A8\u8FD0\u52A8\u978B\u811A\u6B65\u58F0" },
                { id: "shoe_flats", name: "\u5E73\u5E95\u978B", label: "\u5E73\u5E95\u978B", type: "equipment", tagId: "shoe_flats", desc: "\u3010\u978B\u5177\xB7\u5E73\u5E95\u978B\u3011\u8584\u5E95\u5E73\u5E95\u5355\u978B\uFF0C\u6B65\u5C65\u8F7B\u6377\u5747\u5300\uFF0C\u9A71\u52A8\u5E73\u5E95\u978B\u811A\u6B65\u58F0" },
                { id: "shoe_leather", name: "\u5C0F\u76AE\u978B", label: "\u5C0F\u76AE\u978B", type: "equipment", tagId: "shoe_leather", desc: "\u3010\u978B\u5177\xB7\u5C0F\u76AE\u978B\u3011\u786C\u771F\u76AE\u5E95\u4E50\u798F\u978B/\u6821\u670D\u5355\u978B\uFF0C\u5E72\u7EC3\u6E05\u8106\uFF0C\u9A71\u52A8\u5C0F\u76AE\u978B\u811A\u6B65\u58F0" },
                { id: "shoe_platform", name: "\u677E\u7CD5\u978B", label: "\u677E\u7CD5\u978B", type: "equipment", tagId: "shoe_platform", desc: "\u3010\u978B\u5177\xB7\u677E\u7CD5\u978B\u3011\u539A\u5E95\u677E\u7CD5\u978B\uFF0C\u949D\u91CD\u6C89\u95F7\u8E0F\u6B65\uFF0C\u9A71\u52A8\u677E\u7CD5\u978B\u811A\u6B65\u58F0" }
              ],
              defaults: {
                ol: { id: "shoe_heel", name: "\u9AD8\u8DDF\u978B", label: "\u9AD8\u8DDF\u978B", type: "equipment", tagId: "shoe_heel", desc: "\u3010\u978B\u5177\xB7\u9AD8\u8DDF\u978B\u3011\u7EC6\u9AD8\u8DDF\u978B\uFF0C\u6B65\u9891\u6E05\u8106\uFF0C\u8DDF\u9489\u6572\u51FB\u56DE\u54CD\uFF0C\u9A71\u52A8\u9AD8\u8DDF\u978B\u811A\u6B65\u58F0" },
                club: { id: "shoe_boots", name: "\u9774\u5B50", label: "\u9774\u5B50", type: "equipment", tagId: "shoe_boots", desc: "\u3010\u978B\u5177\xB7\u9774\u5B50\u3011\u91CD\u5E95\u76AE\u9769\u9774\u5B50\uFF0C\u786C\u8D28\u539A\u91CD\u8E0F\u6B65\u58F0\uFF0C\u9A71\u52A8\u9774\u5B50\u811A\u6B65\u58F0" },
                wife: { id: "shoe_slippers", name: "\u62D6\u978B", label: "\u62D6\u978B", type: "equipment", tagId: "shoe_slippers", desc: "\u3010\u978B\u5177\xB7\u62D6\u978B\u3011\u5C45\u5BB6\u62D6\u978B\uFF0C\u556A\u55D2\u62D6\u884C\u58F0\uFF0C\u9A71\u52A8\u62D6\u978B\u811A\u6B65\u58F0" },
                police: { id: "shoe_leather", name: "\u5C0F\u76AE\u978B", label: "\u5C0F\u76AE\u978B", type: "equipment", tagId: "shoe_leather", desc: "\u3010\u978B\u5177\xB7\u5C0F\u76AE\u978B\u3011\u4FBF\u8863\u5236\u5F0F\u76AE\u978B\uFF0C\u5229\u843D\u5FAE\u786C\uFF0C\u9A71\u52A8\u5C0F\u76AE\u978B\u811A\u6B65\u58F0" }
              }
            },
            statDelta: {
              options: [-1, 0, 1],
              prob: "\u5747\u5300\u4E09\u7B49\u5206 (\u5404 1/3, 33.33%)",
              clamp: [1, 10]
            }
          }
        },
        tags: {
          timid: { id: "timid", name: "\u80C6\u5C0F", type: "personality", owner: "target", category: "sound", value: -5, desc: "\u3010\u6027\u683C\xB7\u80C6\u5C0F\u3011\u751F\u6027\u80C6\u5C0F\u6015\u4E8B\uFF0C\u53D7\u9A87\u5589\u5499\u53D1\u7D27\u547C\u6551\u5F31\uFF0C\u52A8\u9759\u58F0\u6D6A -5\uFF0C\u591A\u9009\u62E9\u907F\u8D70" },
          bold: { id: "bold", name: "\u80C6\u5927", type: "personality", owner: "target", category: "sound", value: 2, desc: "\u3010\u6027\u683C\xB7\u80C6\u5927\u3011\u80C6\u91CF\u8F83\u5927\uFF0C\u9047\u9669\u6562\u4E8E\u62B5\u6297\uFF0C\u58F0\u6D6A +2\uFF0C\u6323\u8131\u591A\u53CD\u51FB" },
          guarded: { id: "guarded", name: "\u6162\u70ED", type: "personality", owner: "target", category: "social", value: -2, desc: "\u3010\u6027\u683C\xB7\u6162\u70ED\u3011\u9632\u5907\u5FC3\u91CD\uFF0C\u751F\u4EBA\u793E\u4EA4\u4E0E\u642D\u8BDD\u68C0\u5B9A\u4FEE\u6B63 -2" },
          stubborn: { id: "stubborn", name: "\u8981\u5F3A", type: "personality", owner: "target", category: "conflict", value: 1, desc: "\u3010\u6027\u683C\xB7\u8981\u5F3A\u3011\u81EA\u5C0A\u901E\u5F3A\uFF0C\u5BDF\u89C9\u5F02\u6837\u5FEB\u6B65\u4E0D\u793A\u5F31\uFF0C\u51B2\u7A81\u5BF9\u6297\u4F53\u683C +1" },
          vigilant: { id: "vigilant", name: "\u8B66\u60D5", type: "personality", owner: "target", category: "acuity", value: 1, desc: "\u3010\u6027\u683C\xB7\u8B66\u60D5\u3011\u5BF9\u5F02\u54CD\u76F4\u89C9\u654F\u9510\uFF0C\u6709\u6548\u654F\u9510\u6697\u4FEE\u6B63 +1\uFF08\u8B66\u89C9\u589E\u91CF\u591A4%\uFF0C\u8BC6\u8138\u7387\u63D0\u5347\uFF09" },
          gentle: { id: "gentle", name: "\u6E29\u548C", type: "personality", owner: "target", category: "conflict", value: -2, desc: "\u3010\u6027\u683C\xB7\u6E29\u548C\u3011\u6027\u60C5\u6E29\u548C\u907F\u4E89\u7AEF\uFF0C\u53D7\u5236\u6613\u80A2\u4F53\u50F5\u6EDE\uFF0C\u51B2\u7A81\u9996\u8F6E\u53CD\u6297\u6218\u529B -2" },
          hesitant: { id: "hesitant", name: "\u6E29\u9000", type: "personality", owner: "target", category: "conflict", value: -2, desc: "\u3010\u6027\u683C\xB7\u6E29\u9000\u3011\u6027\u60C5\u6E29\u8F6F\u907F\u4E8B\uFF0C\u53D7\u60CA\u540E\u80A2\u4F53\u50F5\u6EDE\uFF0C\u51B2\u7A81\u9996\u8F6E\u53CD\u6297\u6218\u529B -2" },
          casual: { id: "casual", name: "\u968F\u6027", type: "personality", owner: "target", category: "stealth", value: 2, desc: "\u3010\u6027\u683C\xB7\u968F\u6027\u3011\u968F\u548C\u6563\u6F2B\u7701\u4E8B\u81F3\u4E0A\uFF0C\u6C89\u6D78\u81EA\u8EAB\u8282\u594F\u653E\u7A7A\uFF0C\u5BF9\u52A8\u9759\u8FDF\u949D\uFF0C\u73A9\u5BB6\u9690\u853D +2" },
          introverted: { id: "introverted", name: "\u5185\u5411", type: "personality", owner: "target", category: "social", value: -2, desc: "\u3010\u6027\u683C\xB7\u5185\u5411\u3011\u817C\u8146\u5C11\u8A00\u907F\u751F\u4EBA\uFF0C\u4E60\u60EF\u4F4E\u5934\u72EC\u884C\u907F\u5F00\u89C6\u7EBF\uFF0C\u642D\u8BDD\u4E0E\u4EA4\u6D89\u68C0\u5B9A\u4FEE\u6B63 -2" },
          aloof: { id: "aloof", name: "\u6E05\u51B7", type: "personality", owner: "target", category: "sound", value: -2, desc: "\u3010\u6027\u683C\xB7\u6E05\u51B7\u3011\u72EC\u6765\u72EC\u5F80\u758F\u79BB\u51B7\u6DE1\uFF0C\u72EC\u884C\u5C0F\u9053\u65E0\u63A5\u5E94\uFF0C\u52A8\u9759\u58F0\u6D6A\u521D\u503C -2" },
          cheerful: { id: "cheerful", name: "\u5F00\u6717", type: "personality", owner: "target", category: "sound", value: 3, desc: "\u3010\u6027\u683C\xB7\u5F00\u6717\u3011\u6D3B\u6CFC\u5916\u5411\u7CBE\u529B\u5145\u6C9B\uFF0C\u9047\u9669\u53CD\u5E94\u679C\u65AD\u58F0\u7EBF\u6E05\u4EAE\uFF0C\u6562\u4E8E\u547C\u6551\u8D28\u95EE\uFF0C\u58F0\u6D6A +3" },
          chic: { id: "chic", name: "\u7231\u7F8E", type: "personality", owner: "target", category: "stealth", value: 1, desc: "\u3010\u6027\u683C\xB7\u7231\u7F8E\u3011\u6CE8\u91CD\u7A7F\u642D\u4EEA\u5BB9\uFF0C\u5E38\u5728\u6A71\u7A97\u524D\u9A7B\u8DB3\u7406\u8863\u7406\u53D1\uFF0C\u5236\u9020\u77ED\u6682\u505C\u987F\u7834\u7EFD\uFF0C\u73A9\u5BB6\u63A5\u8FD1 +1" },
          naive: { id: "naive", name: "\u5355\u7EAF", type: "personality", owner: "target", category: "social", value: 2, desc: "\u3010\u6027\u683C\xB7\u5355\u7EAF\u3011\u5FC3\u601D\u7B80\u5355\u7F3A\u5C11\u6212\u5907\uFF0C\u8B66\u60D5\u5EFA\u7ACB\u6162\uFF0C\u642D\u8BDD\u4E0E\u95EE\u8DEF\u4EA4\u6D89\u4FEE\u6B63 +2" },
          distracted: { id: "distracted", name: "\u5206\u5FC3", type: "scene", owner: "scene", category: "stealth", value: 2, desc: "\u3010\u60C5\u666F\xB7\u5206\u5FC3\u3011\u540C\u884C\u804A\u5929\u770B\u624B\u673A\u5206\u795E\u6001\uFF0C\u89C6\u91CE\u72ED\u7A84\uFF0C\u73A9\u5BB6\u5C3E\u968F\u9690\u853D +2" },
          accompanied: { id: "accompanied", name: "\u7ED3\u4F34", type: "scene", owner: "target", category: "sound", value: 5, desc: "\u3010\u60C5\u666F\xB7\u7ED3\u4F34\u3011\u8EAB\u8FB9\u6709\u4F34\u540C\u884C\u6001\uFF0C\u58F0\u6D6A +5\uFF0C\u7EC8\u5C40\u52A8\u624B\u6807\u7B7E\u9501\u6B7B" },
          pinned: { id: "pinned", name: "\u538B\u5236", type: "scene", owner: "target", category: "conflict", value: -10, desc: "\u3010\u60C5\u666F\xB7\u538B\u5236\u3011\u5F3A\u653B\u5931\u80FD\u6001\uFF0C\u4F53\u683C\u89C6\u540C1\uFF0C\u58F0\u6D6A\u7981\u7528" },
          frozen: { id: "frozen", name: "\u50F5\u4F4F", type: "scene", owner: "target", category: "conflict", value: -10, desc: "\u3010\u60C5\u666F\xB7\u50F5\u4F4F\u3011\u7EC8\u5C40\u751F\u7406\u6050\u60E7\u6001\uFF0C\u9996\u8F6E\u53CD\u6297\u6218\u529B\u4E3A0\uFF0C\u58F0\u6D6A\u7981\u7528" },
          window_pause: { id: "window_pause", name: "\u80F6\u7247\u63A2\u5E97", type: "hobby", owner: "scene", category: "stealth", value: 1, desc: "\u3010\u7231\u597D\xB7\u80F6\u7247\u63A2\u5E97\u3011\u5E38\u5728\u8857\u89D2\u6A71\u7A97\u505C\u987F\u53D6\u666F\uFF0C\u5C3E\u968F\u8FD1\u8EAB\u68C0\u5B9A +1" },
          sound_muffled: { id: "sound_muffled", name: "\u5927\u8033\u9EA6", type: "hobby", owner: "scene", category: "stealth", value: 1, desc: "\u3010\u7231\u597D\xB7\u5927\u8033\u9EA6\u3011\u4E60\u60EF\u6234\u5927\u8033\u9EA6\u542C\u6B4C\uFF0C\u542C\u89C9\u8FDF\u949D\uFF0C\u73A9\u5BB6\u9690\u853D +1\uFF0C\u58F0\u6D6A\u9608\u503C -3" },
          bag_rummage: { id: "bag_rummage", name: "\u624B\u8D26", type: "hobby", owner: "scene", category: "stealth", value: 1, desc: "\u3010\u7231\u597D\xB7\u624B\u8D26\u3011\u5E38\u5728\u8DEF\u53E3\u9A7B\u8DB3\u7FFB\u5305\u627E\u5F69\u58A8\u7B14\u4E0E\u7968\u636E\uFF0C\u63D0\u4F9B\u80CC\u8EAB\u7834\u7EFD\u7A97\u53E3" },
          aroma_trace: { id: "aroma_trace", name: "\u9999\u6C1B", type: "hobby", owner: "target", category: "acuity", value: 0, desc: "\u3010\u7231\u597D\xB7\u9999\u6C1B\u3011\u6162\u8DD1\u66F4\u8863\u5907\u6709\u9999\u6C1B\u5C0F\u6837\uFF0C\u6563\u53D1\u5FAE\u9999\uFF0C\u8FD1\u8DDD\u79BB\u55C5\u89C9\u8BC6\u522B\u7EBF\u7D22" },
          bag_heavy: { id: "bag_heavy", name: "\u65E7\u4E66", type: "hobby", owner: "target", category: "conflict", value: -1, desc: "\u3010\u7231\u597D\xB7\u65E7\u4E66\u3011\u5E06\u5E03\u5305\u5185\u538B\u7740\u501F\u9605\u65E7\u4E66\uFF0C\u8D1F\u91CD\u62D6\u7D2F\uFF0C\u8FFD\u9010\u5954\u8DD1\u654F\u6377\u5BF9\u6297 -1" },
          bench_still: { id: "bench_still", name: "\u901F\u5199", type: "hobby", owner: "scene", category: "stealth", value: 2, desc: "\u3010\u7231\u597D\xB7\u901F\u5199\u3011\u5E38\u5728\u8DEF\u706F\u957F\u6905\u9759\u5750\u753B\u8857\u666F\uFF0C\u5904\u4E8E\u9759\u6B62\u72B6\u6001\uFF0C\u5C3E\u968F\u9760\u8FD1\u514D\u9664\u79FB\u52A8\u68C0\u5B9A" },
          tired: { id: "tired", name: "\u75B2\u60EB", type: "status", owner: "target", category: "acuity", value: -2, desc: "\u3010\u7279\u8D28\xB7\u75B2\u60EB\u3011\u5E38\u9A7B\u7279\u8D28\uFF1A\u654F\u9510\u6697\u4FEE\u6B63 -2\uFF0C\u7ECF facts.effectiveAcuity \u6263\u51CF\u8FDB\u8BC6\u8138\u7CFB\u6570\u4E0E\u8B66\u89C9\u589E\u91CF" },
          careless: { id: "careless", name: "\u7C97\u5FC3", type: "status", owner: "target", category: "acuity", value: 0, desc: "\u3010\u7279\u8D28\xB7\u7C97\u5FC3\u3011\u5FC3\u4E0D\u5728\u7109\u4E22\u4E09\u843D\u56DB\uFF0C\u5FD8\u9501\u7387 +15%" },
          adv_int: { id: "adv_int", name: "\u4F18\u52BF\uFF1A\u60C5\u62A5", type: "advantage", owner: "player", category: "advantage", value: 0, desc: "\u3010\u4F18\u52BF\xB7\u60C5\u62A5\u3011\u7D2F\u8BA1PI\u226560\uFF1A\u60C5\u62A5\u5C5E\u6027\u68C0\u5B9A\u53CC\u9AB0\u53D6\u9AD8" },
          adv_agi: { id: "adv_agi", name: "\u4F18\u52BF\uFF1A\u654F\u6377", type: "advantage", owner: "player", category: "advantage", value: 0, desc: "\u3010\u4F18\u52BF\xB7\u654F\u6377\u3011\u654F\u6377\u226510\uFF1A\u654F\u6377\u5C5E\u6027\u68C0\u5B9A\u53CC\u9AB0\u53D6\u9AD8" },
          adv_str: { id: "adv_str", name: "\u4F18\u52BF\uFF1A\u4F53\u683C", type: "advantage", owner: "player", category: "advantage", value: 0, desc: "\u3010\u4F18\u52BF\xB7\u4F53\u683C\u3011\u4F53\u683C\u226510\uFF1A\u4F53\u683C\u5C5E\u6027\u68C0\u5B9A\u53CC\u9AB0\u53D6\u9AD8" },
          adv_cha: { id: "adv_cha", name: "\u4F18\u52BF\uFF1A\u53E3\u624D", type: "advantage", owner: "player", category: "advantage", value: 0, desc: "\u3010\u4F18\u52BF\xB7\u53E3\u624D\u3011\u53E3\u624D\u226510\uFF1A\u53E3\u624D\u5C5E\u6027\u68C0\u5B9A\u53CC\u9AB0\u53D6\u9AD8" },
          adv_nrv: { id: "adv_nrv", name: "\u4F18\u52BF\uFF1A\u80C6\u91CF", type: "advantage", owner: "player", category: "advantage", value: 5, desc: "\u3010\u4F18\u52BF\xB7\u80C6\u91CF\u3011\u80C6\u91CF\u226510\uFF1A\u751C\u533A\u4E0A\u9650+5\uFF0865\u219270\uFF09" },
          criminal_look: { id: "criminal_look", name: "\u6302\u76F8", type: "identity", owner: "player", category: "stealth", value: -2, desc: "\u3010\u8EAB\u4EFD\xB7\u6302\u76F8\u3011\u7F6A\u72AF\u5E38\u9A7B\uFF1A\u906E\u853D -2" },
          criminal_blunt: { id: "criminal_blunt", name: "\u65E0\u4E1A\u9762", type: "identity", owner: "player", category: "social", value: -2, desc: "\u3010\u8EAB\u4EFD\xB7\u65E0\u4E1A\u9762\u3011\u7F6A\u72AF\u5E38\u9A7B\uFF1A\u660E\u7EBF\u793E\u4EA4\u7C7B -2" },
          coach_bulk: { id: "coach_bulk", name: "\u5927\u5757\u5934", type: "identity", owner: "player", category: "stealth", value: -2, desc: "\u3010\u8EAB\u4EFD\xB7\u5927\u5757\u5934\u3011\u5065\u8EAB\u6559\u7EC3\u5E38\u9A7B\uFF1A\u906E\u853D -2" },
          shoe_heel: { id: "shoe_heel", name: "\u9AD8\u8DDF\u978B", type: "equipment", owner: "target", category: "equipment", value: 0, mod: { agi: -1 }, noise: 3, desc: "\u3010\u978B\u5177\xB7\u9AD8\u8DDF\u978B\u3011\u7EC6\u9AD8\u8DDF\u978B\uFF0C\u6B65\u9891\u6E05\u8106\uFF0C\u8DDF\u9489\u6572\u51FB\u56DE\u54CD\uFF1B\u9A71\u52A8\u9AD8\u8DDF\u978B\u811A\u6B65\u58F0" },
          shoe_flats: { id: "shoe_flats", name: "\u5E73\u5E95\u978B", type: "equipment", owner: "target", category: "equipment", value: 0, mod: { agi: 0 }, noise: 1, desc: "\u3010\u978B\u5177\xB7\u5E73\u5E95\u978B\u3011\u8584\u5E95\u5E73\u5E95\u5355\u978B\uFF0C\u6B65\u5C65\u8F7B\u6377\u5747\u5300\uFF1B\u9A71\u52A8\u5E73\u5E95\u978B\u811A\u6B65\u58F0" },
          shoe_sneakers: { id: "shoe_sneakers", name: "\u8FD0\u52A8\u978B", type: "equipment", owner: "target", category: "equipment", value: 0, mod: { agi: 1 }, noise: 1, desc: "\u3010\u978B\u5177\xB7\u8FD0\u52A8\u978B\u3011\u8F6F\u80F6\u5E95\u7403\u978B\uFF0C\u89E6\u5730\u9759\u97F3\u5FAE\u6293\u5730\u6469\u64E6\uFF1B\u9A71\u52A8\u8FD0\u52A8\u978B\u811A\u6B65\u58F0" },
          shoe_barefoot: { id: "shoe_barefoot", name: "\u8D64\u811A", type: "equipment", owner: "target", category: "equipment", value: 0, mod: { agi: 0 }, noise: 1, desc: "\u3010\u978B\u5177\xB7\u8D64\u811A\u3011\u8131\u978B\u8D64\u811A\uFF0C\u8089\u638C\u62CD\u51FB\u6E7F\u74F7\u7816/\u5730\u9762\u5FAE\u9ECF\u58F0\uFF1B\u9A71\u52A8\u8D64\u811A\u811A\u6B65\u58F0" },
          shoe_slippers: { id: "shoe_slippers", name: "\u62D6\u978B", type: "equipment", owner: "target", category: "equipment", value: 0, mod: { agi: -1 }, noise: 2, desc: "\u3010\u978B\u5177\xB7\u62D6\u978B\u3011\u5C45\u5BB6\u62D6\u978B\uFF0C\u556A\u55D2\u62D6\u884C\u58F0\uFF1B\u9A71\u52A8\u62D6\u978B\u811A\u6B65\u58F0" },
          shoe_boots: { id: "shoe_boots", name: "\u9774\u5B50", type: "equipment", owner: "target", category: "equipment", value: 0, mod: { agi: 0 }, noise: 3, desc: "\u3010\u978B\u5177\xB7\u9774\u5B50\u3011\u91CD\u5E95\u76AE\u9769\u9774\u5B50\uFF0C\u786C\u8D28\u539A\u91CD\u8E0F\u6B65\u58F0\uFF1B\u9A71\u52A8\u9774\u5B50\u811A\u6B65\u58F0" },
          shoe_platform: { id: "shoe_platform", name: "\u677E\u7CD5\u978B", type: "equipment", owner: "target", category: "equipment", value: 0, mod: { agi: -1 }, noise: 2, desc: "\u3010\u978B\u5177\xB7\u677E\u7CD5\u978B\u3011\u539A\u5E95\u677E\u7CD5\u978B\uFF0C\u949D\u91CD\u6C89\u95F7\u8E0F\u6B65\uFF1B\u9A71\u52A8\u677E\u7CD5\u978B\u811A\u6B65\u58F0" },
          shoe_sandals: { id: "shoe_sandals", name: "\u51C9\u978B", type: "equipment", owner: "target", category: "equipment", value: 0, mod: { agi: 0 }, noise: 2, desc: "\u3010\u978B\u5177\xB7\u51C9\u978B\u3011\u590F\u65E5\u7EC6\u5E26\u51C9\u978B\uFF0C\u7EC6\u5E26\u62CD\u811A\u540E\u8DDF\u8F7B\u8106\u788E\u6B65\uFF1B\u9A71\u52A8\u51C9\u978B\u811A\u6B65\u58F0" },
          shoe_leather: { id: "shoe_leather", name: "\u5C0F\u76AE\u978B", type: "equipment", owner: "target", category: "equipment", value: 0, mod: { agi: 0 }, noise: 2, desc: "\u3010\u978B\u5177\xB7\u5C0F\u76AE\u978B\u3011\u786C\u771F\u76AE\u5E95\u4E50\u798F\u978B/\u5973\u5F0F\u5355\u978B\uFF0C\u5E72\u7EC3\u6E05\u8106\uFF1B\u9A71\u52A8\u5C0F\u76AE\u978B\u811A\u6B65\u58F0" },
          bulky: { id: "bulky", name: "\u8EAB\u5F62\u9192\u76EE", type: "status", owner: "player", category: "stealth", value: -1, desc: "\u3010\u7279\u8D28\xB7\u8EAB\u5F62\u9192\u76EE\u3011\u8EAB\u6750\u9B41\u68A7\u4E0D\u6613\u9690\u85CF\uFF0C\u9690\u853D\u7C7B -1" },
          unobtrusive: { id: "unobtrusive", name: "\u4E0D\u8D77\u773C", type: "status", owner: "player", category: "stealth", value: 1, desc: "\u3010\u7279\u8D28\xB7\u4E0D\u8D77\u773C\u3011\u8EAB\u5F62\u77EE\u5C0F\u6613\u6DF7\u5165\u4EBA\u7FA4\uFF0C\u9690\u853D\u7C7B +1" },
          light_footed: { id: "light_footed", name: "\u811A\u6B65\u8F7B", type: "status", owner: "player", category: "stealth", value: 2, desc: "\u3010\u7279\u8D28\xB7\u811A\u6B65\u8F7B\u3011\u6B65\u5C65\u8F7B\u6377\uFF0C\u9690\u853D\u7C7B +2" },
          clumsy: { id: "clumsy", name: "\u7B28\u62D9", type: "status", owner: "player", category: "stealth", value: -2, desc: "\u3010\u7279\u8D28\xB7\u7B28\u62D9\u3011\u884C\u52A8\u62D6\u6C93\u6613\u5F04\u51FA\u52A8\u9759\uFF0C\u9690\u853D\u7C7B -2" },
          stammer: { id: "stammer", name: "\u7ED3\u5DF4", type: "status", owner: "player", category: "social", value: -2, desc: "\u3010\u7279\u8D28\xB7\u7ED3\u5DF4\u3011\u7D27\u5F20\u7ED3\u5DF4\uFF0C\u53E3\u624D\u7C7B -2" },
          lockpick_gear: { id: "lockpick_gear", name: "\u5F00\u9501\u5DE5\u5177\u5728\u624B", type: "equipment", owner: "player", category: "fine", value: 4, desc: "\u3010\u6F5C\u5165\u88C5\u5907\u3011\u81EA\u5E26\u5F00\u9501\u5DE5\u5177\uFF0C\u5F00\u9501\u68C0\u5B9A\u654F\u6377 +4" },
          climb_steady: { id: "climb_steady", name: "\u6500\u722C\u7A33\u5F53", type: "equipment", owner: "player", category: "fine", value: 2, desc: "\u3010\u6F5C\u5165\u88C5\u5907\u3011\u7A7F\u7740\u6500\u722C\u5957\u88C5\uFF0C\u6500\u4E0A\u4E0E\u843D\u5730\u68C0\u5B9A +2\uFF0C\u58F0\u54CD\u964D\u6863" },
          cyber_lockpick: { id: "cyber_lockpick", name: "\u6570\u636E\u5F00\u9501\u5668", type: "equipment", owner: "player", category: "fine", value: 4, desc: "\u3010\u79D1\u6280\u88C5\u5907\u3011\u6301\u6570\u636E\u5F00\u9501\u5668\uFF0C\u7535\u5B50\u9501\u6570\u636E\u5F00\u9501\u60C5\u62A5 +4" },
          disguise_delivery: { id: "disguise_delivery", name: "\u5916\u5356\u4F2A\u88C5", type: "equipment", owner: "player", category: "social", value: 2, desc: "\u3010\u4F2A\u88C5\u9053\u5177\u3011\u80CC\u8D1F\u5916\u5356\u7BB1\uFF0C\u5199\u5B57\u697C\u4E0E\u4F4F\u5B85\u533A\u95E8\u7981\u901A\u884C +2~3" },
          disguise_property: { id: "disguise_property", name: "\u7269\u4E1A\u4F2A\u88C5", type: "equipment", owner: "player", category: "social", value: 3, desc: "\u3010\u4F2A\u88C5\u9053\u5177\u3011\u8EAB\u7740\u7269\u4E1A\u5236\u670D\uFF0C\u5168\u5929\u5019\u95E8\u7981 +3\uFF0C\u5E26\u6572\u95E8\u68C0\u67E5\u6743" },
          headphones_wear: { id: "headphones_wear", name: "\u8033\u673A\u4F2A\u88C5", type: "equipment", owner: "player", category: "stealth", value: 1, desc: "\u3010\u4FBF\u643A\u914D\u4EF6\u3011\u6234\u4E0A\u8033\u673A\u4F6F\u88C5\u8DEF\u4EBA\uFF0C\u9690\u853D +1" },
          umbrella_shelter: { id: "umbrella_shelter", name: "\u96E8\u4F1E\u906E\u6321", type: "equipment", owner: "player", category: "stealth", value: 1, desc: "\u3010\u4FBF\u643A\u914D\u4EF6\u3011\u96E8\u5929\u6491\u4F1E\u906E\u6321\u89C6\u7EBF\u4E0E\u9762\u90E8\uFF0C\u9690\u853D +1" },
          amulet_peace: { id: "amulet_peace", name: "\u62A4\u8EAB\u7B26", type: "equipment", owner: "player", category: "nrv", value: 1, desc: "\u3010\u7EAA\u5FF5\u7269\u3011\u5FC3\u795E\u5B89\u5B9A\uFF0C\u80C6\u91CF\u68C0\u5B9A +1" },
          hand_phone: { id: "hand_phone", name: "\u800D\u624B\u673A", type: "scene", owner: "target", category: "stealth", value: 2, desc: "\u3010\u53CC\u624B\xB7\u800D\u624B\u673A\u3011\u89C6\u7EBF\u5438\u5728\u5C4F\u5E55\u4E0A\uFF0C\u77E5\u89C9\u8FDF\u949D\uFF0C\u73A9\u5BB6\u8DDF\u7F00\u9690\u853D +2" },
          hand_pocket: { id: "hand_pocket", name: "\u53CC\u624B\u4FDD\u6696", type: "scene", owner: "target", category: "conflict", value: 2, desc: "\u3010\u53CC\u624B\xB7\u4FDD\u6696\u3011\u53CC\u624B\u6DF1\u9677\u53E3\u888B/\u7F29\u8896\u53E3\uFF0C\u9047\u9669\u53CD\u6297\u8FDF\u949D\uFF0C\u51B2\u7A81\u5BF9\u6297 DC -2" },
          hand_fumble: { id: "hand_fumble", name: "\u7FFB\u627E\u7269\u54C1", type: "scene", owner: "target", category: "stealth", value: 3, desc: "\u3010\u53CC\u624B\xB7\u7FFB\u627E\u3011\u4F4E\u5934\u7FFB\u5305\u627E\u7269\uFF0C\u89C6\u7EBF\u79BB\u5F00\u8857\u9053\uFF0C\u8DDF\u7F00\u9690\u853D +3" },
          hand_call: { id: "hand_call", name: "\u63A5\u7535\u8BDD", type: "scene", owner: "target", category: "stealth", value: 1, desc: "\u3010\u53CC\u624B\xB7\u63A5\u7535\u8BDD\u3011\u5355\u624B\u6301\u673A\u5E94\u7B54\uFF0C\u63A9\u76D6\u811A\u6B65\uFF0C\u73A9\u5BB6\u9690\u853D +1" },
          hand_book: { id: "hand_book", name: "\u770B\u4E66", type: "scene", owner: "target", category: "stealth", value: 2, desc: "\u3010\u53CC\u624B\xB7\u770B\u4E66\u3011\u53CC\u624B\u6367\u624B\u518C\u4F4E\u5934\u9ED8\u80CC\uFF0C\u73A9\u5BB6\u9690\u853D +2" },
          hand_drink: { id: "hand_drink", name: "\u559D\u996E\u54C1", type: "scene", owner: "target", category: "stealth", value: 1, desc: "\u3010\u53CC\u624B\xB7\u559D\u996E\u54C1\u3011\u5355\u624B\u6367\u70ED\u996E\u54AC\u5438\u7BA1\uFF0C\u73A9\u5BB6\u9690\u853D +1" },
          hand_eat: { id: "hand_eat", name: "\u5403\u4E1C\u897F", type: "scene", owner: "target", category: "stealth", value: 1, desc: "\u3010\u53CC\u624B\xB7\u5403\u4E1C\u897F\u3011\u5355\u624B\u62FF\u9632\u6CB9\u7EB8\u888B\u5C0F\u5403\uFF0C\u73A9\u5BB6\u9690\u853D +1" },
          somatic_relaxed: { id: "somatic_relaxed", name: "\u8F7B\u677E\u8212\u7545", type: "status", owner: "target", category: "acuity", value: 0, desc: "\u3010\u8EAB\u5FC3\xB7\u8F7B\u677E\u8212\u7545\u3011\u5FC3\u60C5\u677E\u5F1B\uFF0C\u6709\u6548\u654F\u9510 -1\uFF0C\u8B66\u89C9\u589E\u957F\u53D8\u6162\uFF08\u5C5E\u6027\u5DF2\u7531 somatic.mod \u751F\u6548\uFF0C\u6807\u7B7E\u4F5C\u72B6\u6001\u5448\u73B0\uFF09" },
          somatic_fatigued: { id: "somatic_fatigued", name: "\u8EAB\u5FC3\u75B2\u60EB", type: "status", owner: "target", category: "conflict", value: 0, desc: "\u3010\u8EAB\u5FC3\xB7\u8EAB\u5FC3\u75B2\u60EB\u3011\u53CC\u817F\u9178\u6C89\uFF0C\u9003\u8DD1\u8FDF\u7F13\uFF0C\u51B2\u7A81\u5BF9\u6297 DC -1\uFF08\u5C5E\u6027\u5DF2\u7531 somatic.mod \u751F\u6548\uFF0C\u6807\u7B7E\u4F5C\u72B6\u6001\u5448\u73B0\uFF09" },
          somatic_rushing: { id: "somatic_rushing", name: "\u7D27\u7EF7\u8D76\u8DEF", type: "status", owner: "target", category: "conflict", value: 0, desc: "\u3010\u8EAB\u5FC3\xB7\u7D27\u7EF7\u8D76\u8DEF\u3011\u95E8\u7981\u903C\u8FD1\uFF0C\u6B65\u4F10\u6025\u4FC3\u524D\u503E\uFF0C\u51B2\u7A81\u5BF9\u6297 DC +1\uFF08\u5C5E\u6027\u5DF2\u7531 somatic.mod \u751F\u6548\uFF0C\u6807\u7B7E\u4F5C\u72B6\u6001\u5448\u73B0\uFF09" },
          somatic_limping: { id: "somatic_limping", name: "\u6B65\u5C65\u8E52\u8DDA", type: "status", owner: "target", category: "agility", value: 0, desc: "\u3010\u8EAB\u5FC3\xB7\u6B65\u5C65\u8E52\u8DDA\u3011\u52A8\u4F5C\u5E45\u5EA6\u6536\u655B\uFF0C\u53CC\u817F\u8F7B\u5FAE\u5E76\u62E2\uFF0C\u8FC8\u6B65\u7A0D\u5927\u65F6\u8F7B\u5FAE\u5438\u6C14\uFF0C\u4F3C\u89E6\u53CA\u75DB\u5904\uFF0C\u654F\u6377 -2\uFF08\u5C5E\u6027\u5DF2\u7531 somatic.mod \u751F\u6548\uFF0C\u6807\u7B7E\u4F5C\u72B6\u6001\u5448\u73B0\uFF09" },
          limping: { id: "limping", name: "\u6B65\u5C65\u8E52\u8DDA", type: "status", owner: "target", category: "agility", value: 0, desc: "\u3010\u8EAB\u5FC3\xB7\u6B65\u5C65\u8E52\u8DDA\u3011\u52A8\u4F5C\u5E45\u5EA6\u6536\u655B\uFF0C\u53CC\u817F\u8F7B\u5FAE\u5E76\u62E2\uFF0C\u8FC8\u6B65\u7A0D\u5927\u65F6\u8F7B\u5FAE\u5438\u6C14\uFF0C\u4F3C\u89E6\u53CA\u75DB\u5904\uFF0C\u654F\u6377 -2\uFF08\u5C5E\u6027\u5DF2\u7531 somatic.mod \u751F\u6548\uFF0C\u6807\u7B7E\u4F5C\u72B6\u6001\u5448\u73B0\uFF09" }
        },
        items: {
          lockpick: {
            id: "lockpick",
            name: "\u5F00\u9501\u5DE5\u5177",
            type: "tool",
            slot: "tool",
            price: 500,
            tag: "lockpick_gear",
            effectsDesc: "\u5F00\u9501\u8DEF\u7EBF\u654F\u6377+4",
            desc: "\u6F5C\u5165\u5DE5\u5177\uFF08\u5360\u5DE5\u5177\u69FD\uFF09\uFF1A\u89E3\u9501\u5F00\u9501\u8DEF\u7EBF\uFF0C\u654F\u6377\u68C0\u5B9A+4\uFF0C\u4E0E\u6500\u722C\u5957\u88C5\u4E92\u65A5\u5360\u69FD"
          },
          climb_gear: {
            id: "climb_gear",
            name: "\u6500\u722C\u5957\u88C5",
            type: "tool",
            slot: "tool",
            price: 500,
            tag: "climb_steady",
            effectsDesc: "\u6500\u722C/\u843D\u5730+2\xB7\u58F0\u54CD\u964D\u6863",
            desc: "\u6F5C\u5165\u5DE5\u5177\uFF08\u5360\u5DE5\u5177\u69FD\uFF09\uFF1A\u6500\u4E0A\u4E0E\u843D\u5730\u68C0\u5B9A+2\uFF0C\u6454\u843D\u58F0\u54CD\u964D\u4E00\u6863\uFF0C\u4E0E\u5F00\u9501\u5DE5\u5177\u4E92\u65A5\u5360\u69FD"
          },
          cyber_lockpick: {
            id: "cyber_lockpick",
            name: "\u6570\u636E\u5F00\u9501\u5668",
            type: "tech",
            slot: null,
            price: 1200,
            tag: "cyber_lockpick",
            effectsDesc: "\u6570\u636E\u5F00\u9501\u60C5\u62A5+4",
            desc: "\u79D1\u6280\u95E8\u7968\uFF08\u4E0D\u5360\u5DE5\u5177\u69FD\uFF09\uFF1A\u89E3\u9501\u5355\u5143\u95E8\u7981\u4E0E\u667A\u80FD\u9501\u6570\u636E\u5F00\u9501\uFF0C\u60C5\u62A5+4"
          },
          cam_storage: {
            id: "cam_storage",
            name: "\u9488\u5B54\u6444\u50CF\u673A(\u5B58\u50A8\u6863)",
            type: "device",
            slot: null,
            price: 800,
            effectsDesc: "\u65E5\u7A0B\u8865\u5168\xB7\u5FC3\u4E8B\u7EBF\u76F4\u8FBE",
            desc: "\u6570\u5B57\u76D1\u63A7\u8BBE\u5907\uFF08\u963F\u5B85\u5F00\u5C40\u81EA\u5E26\uFF09\uFF1A\u5B89\u88C5\u5373\u5E38\u9A7B\uFF0C\u5C45\u5BB6\u65E5\u7A0B\u8865\u5168\uFF0C\u5FC3\u4E8B\u7EBF\u76F4\u8FBE"
          },
          cam_wireless: {
            id: "cam_wireless",
            name: "\u9488\u5B54\u6444\u50CF\u673A(\u65E0\u7EBF\u6863)",
            type: "device",
            slot: null,
            price: 1500,
            effectsDesc: "\u8FDC\u7A0B\u5B9E\u65F6\xB7\u8BFB\u65F6\u673A\u53CC\u9AB0",
            desc: "\u6570\u5B57\u76D1\u63A7\u8BBE\u5907\uFF1A\u8FDC\u7A0B\u65E0\u7EBF\u56FE\u4F20\uFF0C\u8BFB\u65F6\u673A\u53CC\u9AB0\u53D6\u9AD8"
          },
          cam_waterproof: {
            id: "cam_waterproof",
            name: "\u9488\u5B54\u6444\u50CF\u673A(\u9632\u6C34\u6863)",
            type: "device",
            slot: null,
            price: 1600,
            effectsDesc: "\u6D74\u5BA4\u4E13\u7528\xB7\u7EC8\u5C40\u7A97\u53E3",
            desc: "\u6570\u5B57\u76D1\u63A7\u8BBE\u5907\uFF1A\u7EB3\u7C73\u9632\u6C34\u5BC6\u5C01\uFF0C\u536B\u6D74\u73AF\u5883\u4E13\u7528"
          },
          gps_tracker: {
            id: "gps_tracker",
            name: "\u5B9A\u4F4D\u5668",
            type: "device",
            slot: null,
            price: 800,
            effectsDesc: "\u4F4D\u7F6E\u8FFD\u8E2A\xB7\u5931\u8054\u5236",
            desc: "\u6570\u5B57\u76D1\u63A7\u8BBE\u5907\uFF1A\u5B89\u88C5\u968F\u8EAB\u7269\u8FFD\u8E2A\u52A8\u7EBF\uFF0C\u914D\u5408\u4F4D\u7F6E\u7CFB\u7EDF"
          },
          takeout_box: {
            id: "takeout_box",
            name: "\u5916\u5356\u7BB1",
            type: "disguise",
            slot: "disguise",
            price: 300,
            tag: "disguise_delivery",
            effectsDesc: "\u95E8\u7981\u901A\u884C+2~3",
            desc: "\u4F2A\u88C5\u9053\u5177\uFF1A\u5199\u5B57\u697C\u4E0E\u4F4F\u5B85\u533A\u5916\u5356\u5458\u8EAB\u4EFD\u901A\u884C\u514D\u68C0/\u52A0\u6210+2~3"
          },
          property_uniform: {
            id: "property_uniform",
            name: "\u7269\u4E1A\u5236\u670D",
            type: "disguise",
            slot: "disguise",
            price: 400,
            tag: "disguise_property",
            effectsDesc: "\u5168\u5929\u95E8\u7981+3\xB7\u6572\u95E8\u6743",
            desc: "\u4F2A\u88C5\u9053\u5177\uFF1A\u5168\u5929\u5019\u95E8\u7981+3\uFF0C\u9644\u5E26\u6572\u95E8\u68C0\u67E5\u6743\uFF0C\u7167\u9762\u9700\u8BC6\u7834\u5BF9\u6297"
          },
          energy_drink: {
            id: "energy_drink",
            name: "\u80FD\u91CF\u996E\u6599",
            type: "consumable",
            slot: null,
            price: 30,
            effectsDesc: "\u4F53\u529B+20\xB7\u5FC3\u8DF3+10(\u591C\u4E13\u4F9B)",
            desc: "\u6D88\u8017\u8865\u7ED9\uFF1A\u591C\u95F4\u4E13\u4F9B\u7EED\u547D\uFF0C\u4F53\u529B+20\u4F46\u5FC3\u8DF3+10\uFF0C\u6BCF\u665A\u9650\u996E1\u74F6"
          },
          bento: {
            id: "bento",
            name: "\u4FBF\u5F53",
            type: "consumable",
            slot: null,
            price: 20,
            effectsDesc: "\u4F53\u529B+20",
            desc: "\u6D88\u8017\u8865\u7ED9\uFF1A\u4E09\u9910\u989D\u5EA6\uFF0C\u4F7F\u7528\u5373\u6062\u590D\u4F53\u529B+20"
          },
          onigiri: {
            id: "onigiri",
            name: "\u996D\u56E2",
            type: "consumable",
            slot: null,
            price: 8,
            effectsDesc: "\u4F53\u529B+8",
            desc: "\u6D88\u8017\u8865\u7ED9\uFF1A\u4E09\u9910\u989D\u5EA6\uFF0C\u4F7F\u7528\u5373\u6062\u590D\u4F53\u529B+8"
          },
          coffee: {
            id: "coffee",
            name: "\u70ED\u5496\u5561",
            type: "consumable",
            slot: null,
            price: 20,
            effectsDesc: "\u884C\u52A8\u70B9+0.5",
            desc: "\u6D88\u8017\u8865\u7ED9\uFF1A\u767D\u5929\u63D0\u795E\uFF0C\u884C\u52A8\u70B9+0.5\uFF0C\u65E5\u9650\u4E24\u676F"
          },
          headphones: {
            id: "headphones",
            name: "\u84DD\u7259\u8033\u673A",
            type: "gear",
            slot: "accessory",
            price: 150,
            tag: "headphones_wear",
            effectsDesc: "\u4F6F\u88C5\u8DEF\u4EBA\xB7\u9690\u853D+1",
            desc: "\u4FBF\u643A\u914D\u4EF6\uFF1A\u4F6F\u88C5\u8DEF\u4EBA\u542C\u6B4C\uFF0C\u9690\u853D+1"
          },
          umbrella: {
            id: "umbrella",
            name: "\u96E8\u4F1E",
            type: "gear",
            slot: "hand",
            price: 60,
            tag: "umbrella_shelter",
            effectsDesc: "\u96E8\u5929\u906E\u6321\xB7\u9690\u853D+1",
            desc: "\u4FBF\u643A\u914D\u4EF6\uFF1A\u96E8\u5929\u906E\u853D\u89C6\u7EBF\u9690\u853D+1\uFF0C\u501F\u4F1E\u8282\u70B9\u95E8\u7968"
          },
          amulet: {
            id: "amulet",
            name: "\u62A4\u8EAB\u7B26",
            type: "trophy",
            slot: "pouch",
            price: 0,
            tag: "amulet_peace",
            effectsDesc: "\u5FC3\u795E\u5B89\u5B9A\xB7\u80C6\u91CF+1",
            desc: "\u7EAA\u5FF5\u7269/\u56DE\u793C\uFF1A\u5FC3\u795E\u5B89\u5B9A\uFF0C\u80C6\u91CF\u68C0\u5B9A+1"
          },
          item_retro_cam: {
            id: "item_retro_cam",
            name: "\u590D\u53E4\u5361\u7247\u673A",
            type: "trophy",
            slot: null,
            price: 300,
            effectsDesc: "\u80F6\u7247\u8857\u62CD\xB7\u751F\u6D3B\u7167PI+20",
            desc: "\u6218\u5229\u54C1/\u79C1\u5BC6\u7269\u8BC1\uFF1A\u968F\u8EAB\u590D\u53E4\u5361\u7247\u673A\uFF0C\u5185\u542B\u8857\u89D2\u6A71\u7A97\u53D6\u666F\u7167\u7247"
          },
          item_headphone: {
            id: "item_headphone",
            name: "\u5934\u6234\u8033\u9EA6",
            type: "trophy",
            slot: null,
            price: 200,
            effectsDesc: "\u964D\u566A\u8033\u9EA6\xB7\u542C\u6B4C\u504F\u597DPI+15",
            desc: "\u6218\u5229\u54C1/\u79C1\u5BC6\u7269\u8BC1\uFF1A\u5E38\u6234\u7684\u5934\u6234\u5F0F\u5927\u8033\u9EA6\uFF0C\u5B58\u6709\u79C1\u5BC6\u6B4C\u5355"
          },
          item_handbook: {
            id: "item_handbook",
            name: "\u79C1\u5BC6\u624B\u8D26",
            type: "trophy",
            slot: null,
            price: 150,
            effectsDesc: "\u624B\u8D26\u5C0F\u7968\xB7\u65E5\u7A0B\u60C5\u62A5PI+25",
            desc: "\u6218\u5229\u54C1/\u79C1\u5BC6\u7269\u8BC1\uFF1A\u8D34\u6EE1\u5F69\u58A8\u7B14\u8FF9\u4E0E\u6D88\u8D39\u5C0F\u7968\u7684\u968F\u8EAB\u624B\u8D26"
          },
          item_perfume: {
            id: "item_perfume",
            name: "\u9999\u6C1B\u5C0F\u6837",
            type: "trophy",
            slot: null,
            price: 100,
            effectsDesc: "\u968F\u8EAB\u5FAE\u9999\xB7\u55C5\u89C9\u8BC6\u522B\u7EBF\u7D22",
            desc: "\u6218\u5229\u54C1/\u79C1\u5BC6\u7269\u8BC1\uFF1A\u4FBF\u643A\u5C0F\u74F6\u88C5\u9999\u6C1B\u55B7\u96FE\uFF0C\u8FD1\u8DDD\u79BB\u6563\u53D1\u5FAE\u9999"
          },
          item_old_book: {
            id: "item_old_book",
            name: "\u501F\u9605\u65E7\u4E66",
            type: "trophy",
            slot: null,
            price: 80,
            effectsDesc: "\u501F\u4E66\u5361\xB7\u501F\u9605\u8F68\u8FF9PI+10",
            desc: "\u6218\u5229\u54C1/\u79C1\u5BC6\u7269\u8BC1\uFF1A\u6587\u6559\u533A\u501F\u9605\u65E7\u4E66\uFF0C\u5939\u7740\u5E72\u71E5\u82B1\u8349\u4E66\u7B7E"
          },
          item_sketchbook: {
            id: "item_sketchbook",
            name: "\u5FAE\u578B\u901F\u5199\u672C",
            type: "trophy",
            slot: null,
            price: 120,
            effectsDesc: "\u8857\u666F\u8349\u56FE\xB7\u957F\u6905\u9A7B\u8DB3PI+20",
            desc: "\u6218\u5229\u54C1/\u79C1\u5BC6\u7269\u8BC1\uFF1A\u7EB8\u9762\u94C5\u7B14\u901F\u5199\u672C\uFF0C\u8BB0\u5F55\u7740\u591C\u8DEF\u8DEF\u706F\u4E0E\u957F\u6905"
          }
        }
      };
    }
  });

  // src/config/lexicon.json
  var require_lexicon = __commonJS({
    "src/config/lexicon.json"(exports, module) {
      module.exports = {
        modes: [
          "prepare",
          "stealth",
          "contact",
          "vehicle",
          "any"
        ],
        argKeys: {
          dist: {
            far: [
              "\u8FDC\u7AEF",
              "\u8FDC\u8FDC",
              "\u5BF9\u8857",
              "\u9A6C\u8DEF\u5BF9\u9762",
              "\u9694\u7740\u8857"
            ],
            same: [
              "\u540C\u8857",
              "\u540C\u4FA7",
              "\u534A\u6761\u8857",
              "\u4E8C\u5341\u6B65",
              "\u8DDF\u7740\u8D70"
            ],
            close: [
              "\u8EAB\u540E",
              "\u5341\u6B65",
              "\u5341\u6B65\u5DE6\u53F3",
              "\u8D34\u7740\u70B9"
            ],
            touch: [
              "\u8D34\u8EAB",
              "\u6328\u7740",
              "\u4E00\u6B65\u4E4B\u5185",
              "\u4F38\u624B\u53EF\u53CA"
            ]
          },
          style: {
            ambush: [
              "\u5077\u88AD",
              "\u6342\u4F4F\u5979",
              "\u6478\u4E0A\u53BB",
              "\u8D81\u5979\u4E0D\u6CE8\u610F",
              "\u8D34\u8EAB\u4E0B\u624B"
            ],
            assault: [
              "\u5F3A\u653B",
              "\u76F4\u63A5\u51B2\u4E0A\u53BB",
              "\u6B63\u9762\u52A8\u624B",
              "\u5236\u670D\u5979",
              "\u6251\u4E0A\u53BB"
            ]
          }
        },
        defaultArgs: {
          follow: {
            dist: "same"
          },
          strike: {
            style: "ambush"
          }
        },
        tags: {
          timid: {
            id: "timid",
            name: "\u80C6\u5C0F",
            aliases: [
              "\u80C6\u5C0F",
              "\u80C6\u602F",
              "\u602F\u61E6"
            ],
            effects: [
              {
                category: "sound",
                value: -5
              }
            ],
            desc: "\u80C6\u91CF\u22643\u9608\u503C\u6807\u7B7E\uFF0C\u58F0\u6D6A-5\uFF0C\u6323\u8131\u591A\u9003\u8DD1"
          },
          bold: {
            id: "bold",
            name: "\u80C6\u5927",
            aliases: [
              "\u80C6\u5927",
              "\u5927\u80C6",
              "\u6CFC\u8FA3",
              "\u521A\u70C8"
            ],
            effects: [
              {
                category: "sound",
                value: 2
              }
            ],
            desc: "\u80C6\u91CF\u22656\u9608\u503C\u6807\u7B7E\uFF0C\u58F0\u6D6A+2\uFF0C\u6323\u8131\u591A\u53CD\u51FB"
          },
          pinned: {
            id: "pinned",
            name: "\u538B\u5236",
            aliases: [
              "\u538B\u5236",
              "\u5236\u670D",
              "\u5931\u80FD\u6001"
            ],
            effects: [
              {
                category: "conflict",
                value: -10
              }
            ],
            desc: "\u5F3A\u653B\u5931\u80FD\u6001\uFF0C\u4F53\u683C\u89C6\u540C1\uFF0C\u58F0\u6D6A\u7981\u7528"
          },
          frozen: {
            id: "frozen",
            name: "\u50F5\u4F4F",
            aliases: [
              "\u50F5\u4F4F",
              "\u5413\u5446",
              "\u50F5\u6B7B"
            ],
            effects: [
              {
                category: "conflict",
                value: -10
              }
            ],
            desc: "\u7EC8\u5C40\u751F\u7406\u6050\u60E7\u6001\uFF0C\u9996\u8F6E\u53CD\u6297\u6218\u529B\u4E3A0\uFF0C\u58F0\u6D6A\u7981\u7528"
          },
          hesitant: {
            id: "hesitant",
            name: "\u8FDF\u7591",
            aliases: [
              "\u8FDF\u7591",
              "\u9519\u6115",
              "\u4E0D\u6562\u7F6E\u4FE1"
            ],
            effects: [
              {
                category: "conflict",
                value: -10
              }
            ],
            desc: "\u719F\u4EBA\u8BA4\u77E5\u5D29\u6E83\u6001\uFF0C\u9996\u8F6E\u6218\u529B-10\uFF0C\u9996\u62CD\u65E0\u6CD5\u547C\u6551"
          },
          distracted: {
            id: "distracted",
            name: "\u76EE\u6807\u5206\u5FC3",
            aliases: [
              "\u76EE\u6807\u5206\u5FC3",
              "\u5206\u5FC3",
              "\u8D70\u795E"
            ],
            effects: [
              {
                category: "stealth",
                value: 2
              }
            ],
            desc: "\u540C\u884C\u804A\u5929\u770B\u624B\u673A\u5206\u795E\u6001\uFF0C\u73A9\u5BB6\u5C3E\u968F\u9690\u853D+2"
          },
          accompanied: {
            id: "accompanied",
            name: "\u7ED3\u4F34\u540C\u884C",
            aliases: [
              "\u7ED3\u4F34\u540C\u884C",
              "\u7ED3\u4F34",
              "\u6709\u4EBA\u966A",
              "\u540C\u884C"
            ],
            effects: [
              {
                category: "sound",
                value: 5
              }
            ],
            desc: "\u8EAB\u8FB9\u6709\u4F34\u540C\u884C\u6001\uFF0C\u58F0\u6D6A+5\uFF0C\u7EC8\u5C40\u52A8\u624B\u6807\u7B7E\u9501\u6B7B"
          },
          tired: {
            id: "tired",
            name: "\u75B2\u60EB",
            aliases: [
              "\u75B2\u60EB",
              "\u75B2\u5026",
              "\u52B3\u7D2F",
              "\u54C8\u6B20\u8FDE\u5929"
            ],
            effects: [],
            desc: "\u5E38\u9A7B\u7279\u8D28\uFF08pack.traits\uFF09\uFF1A\u654F\u9510\u6697\u4FEE\u6B63-2\uFF08\u6570\u503C\u771F\u6E90 rules.tags.tired\uFF09\uFF0C\u7ECF facts.effectiveAcuity \u6263\u51CF\u8FDB\u8BC6\u8138\u7CFB\u6570\u4E0E\u8B66\u89C9\u589E\u91CF\uFF1B\u4E0D\u6302\u573A\u666F\u6807\u7B7E\u6808"
          },
          adv_int: {
            id: "adv_int",
            name: "\u4F18\u52BF\uFF1A\u60C5\u62A5",
            aliases: [
              "\u4F18\u52BF\u60C5\u62A5",
              "\u60C5\u62A5\u4F18\u52BF"
            ],
            effects: [],
            desc: "\u9608\u503C\u6807\u7B7E\uFF1A\u7D2F\u8BA1PI\u226560\u81EA\u52A8\u6302\u2014\u2014\u60C5\u62A5\u5C5E\u60271d20\u68C0\u5B9A\u5355\u9AB0\u53D8\u53CC\u9AB0\uFF08\u670920\u5FC5\u53D620/\u65E020\u67091\u53D61/\u5426\u5219\u53D6\u9AD8\uFF09\uFF1B\u91D1\u8272\u663E\u793A"
          },
          adv_agi: {
            id: "adv_agi",
            name: "\u4F18\u52BF\uFF1A\u654F\u6377",
            aliases: [
              "\u4F18\u52BF\u654F\u6377",
              "\u654F\u6377\u4F18\u52BF"
            ],
            effects: [],
            desc: "\u9608\u503C\u6807\u7B7E\uFF1A\u654F\u6377\u226510\u81EA\u52A8\u6302\u2014\u2014\u654F\u6377\u5C5E\u60271d20\u68C0\u5B9A\u5355\u9AB0\u53D8\u53CC\u9AB0\uFF08\u5929\u7136\u94C1\u5F8B\u540C\u4E0A\uFF09\uFF1B\u91D1\u8272\u663E\u793A"
          },
          adv_str: {
            id: "adv_str",
            name: "\u4F18\u52BF\uFF1A\u4F53\u683C",
            aliases: [
              "\u4F18\u52BF\u4F53\u683C",
              "\u4F53\u683C\u4F18\u52BF"
            ],
            effects: [],
            desc: "\u9608\u503C\u6807\u7B7E\uFF1A\u4F53\u683C\u226510\u81EA\u52A8\u6302\u2014\u2014\u4F53\u683C\u5C5E\u60271d20\u68C0\u5B9A\u5355\u9AB0\u53D8\u53CC\u9AB0\uFF08\u51B2\u7A81\u5BF9\u62972d10\u4E0D\u5403\uFF09\uFF1B\u91D1\u8272\u663E\u793A"
          },
          adv_cha: {
            id: "adv_cha",
            name: "\u4F18\u52BF\uFF1A\u53E3\u624D",
            aliases: [
              "\u4F18\u52BF\u53E3\u624D",
              "\u53E3\u624D\u4F18\u52BF"
            ],
            effects: [],
            desc: "\u9608\u503C\u6807\u7B7E\uFF1A\u53E3\u624D\u226510\u81EA\u52A8\u6302\u2014\u2014\u53E3\u624D\u5C5E\u60271d20\u68C0\u5B9A\u5355\u9AB0\u53D8\u53CC\u9AB0\uFF1B\u91D1\u8272\u663E\u793A"
          },
          adv_nrv: {
            id: "adv_nrv",
            name: "\u4F18\u52BF\uFF1A\u80C6\u91CF",
            aliases: [
              "\u4F18\u52BF\u80C6\u91CF",
              "\u80C6\u91CF\u4F18\u52BF"
            ],
            effects: [],
            desc: "\u9608\u503C\u6807\u7B7E\uFF1A\u80C6\u91CF\u226510\u81EA\u52A8\u6302\u2014\u2014\u751C\u533A\u4E0A\u9650+5\uFF0865\u219270\uFF09\uFF0C\u6BB5\u4F4D\u7A0E\u751C\u533A\u6863\u540C\u6B65\u62D3\u5BBD\uFF1B\u975E\u53CC\u9AB0\u6548\u679C"
          },
          criminal_look: {
            id: "criminal_look",
            name: "\u6302\u76F8",
            aliases: [
              "\u6302\u76F8",
              "\u4E00\u8138\u51F6\u76F8"
            ],
            effects: [
              {
                category: "stealth",
                value: -2
              }
            ],
            desc: "\u8EAB\u4EFD\u5E38\u9A7B\u6807\u7B7E\uFF08v0.8\uFF09\uFF1A\u7F6A\u72AF\u5F00\u5C40\u81EA\u52A8\u6302\u2014\u2014\u906E\u853D-2\uFF08\u773C\u795E\u6C14\u8D28\u85CF\u4E0D\u4F4F\uFF09\uFF1B\u5F15\u64CE\u6302\u8F7D\u975ELLM\u7533\u62A5"
          },
          criminal_blunt: {
            id: "criminal_blunt",
            name: "\u65E0\u4E1A\u9762",
            aliases: [
              "\u65E0\u4E1A\u9762",
              "\u4E0D\u50CF\u6B63\u7ECF\u4EBA"
            ],
            effects: [
              {
                category: "social",
                value: -2
              }
            ],
            desc: "\u8EAB\u4EFD\u5E38\u9A7B\u6807\u7B7E\uFF08v0.8\uFF09\uFF1A\u7F6A\u72AF\u5F00\u5C40\u81EA\u52A8\u6302\u2014\u2014\u660E\u7EBF\u793E\u4EA4\u7C7B-2\uFF08\u642D\u8BDD/\u5BD2\u6684/\u6D88\u7591/\u5E94\u5BF9\u76D8\u95EE/\u4F2A\u88C5\u8BBF\u5BA2/\u5957\u8BDD\u5168\u8868\uFF09\uFF1B\u5F15\u64CE\u6302\u8F7D\u975ELLM\u7533\u62A5"
          },
          coach_bulk: {
            id: "coach_bulk",
            name: "\u5927\u5757\u5934",
            aliases: [
              "\u5927\u5757\u5934",
              "\u5757\u5934\u592A\u5927"
            ],
            effects: [
              {
                category: "stealth",
                value: -2
              }
            ],
            desc: "\u8EAB\u4EFD\u5E38\u9A7B\u6807\u7B7E\uFF08v0.8\uFF09\uFF1A\u5065\u8EAB\u6559\u7EC3\u5F00\u5C40\u81EA\u52A8\u6302\u2014\u2014\u906E\u853D-2\uFF08\u5927\u5757\u5934\u76EE\u6807\u5927\uFF09\uFF1B\u5F15\u64CE\u6302\u8F7D\u975ELLM\u7533\u62A5"
          },
          shoe_heel: {
            id: "shoe_heel",
            name: "\u9AD8\u8DDF\u978B",
            aliases: [
              "\u9AD8\u8DDF\u978B",
              "\u7EC6\u9AD8\u8DDF"
            ],
            effects: [],
            desc: "\u76EE\u6807\u978B\u5177\uFF1A\u7EC6\u9AD8\u8DDF\u978B\uFF0C\u6B65\u9891\u6E05\u8106\uFF0C\u8DDF\u9489\u6572\u51FB\u56DE\u54CD\uFF1B\u9A71\u52A8\u9AD8\u8DDF\u978B\u811A\u6B65\u58F0"
          },
          shoe_flats: {
            id: "shoe_flats",
            name: "\u5E73\u5E95\u978B",
            aliases: [
              "\u5E73\u5E95\u978B",
              "\u5E73\u5E95\u5355\u978B"
            ],
            effects: [],
            desc: "\u76EE\u6807\u978B\u5177\uFF1A\u8584\u5E95\u5E73\u5E95\u5355\u978B\uFF0C\u6B65\u5C65\u8F7B\u6377\u5747\u5300\uFF1B\u9A71\u52A8\u5E73\u5E95\u978B\u811A\u6B65\u58F0"
          },
          shoe_sneakers: {
            id: "shoe_sneakers",
            name: "\u8FD0\u52A8\u978B",
            aliases: [
              "\u8FD0\u52A8\u978B",
              "\u7403\u978B",
              "\u8DD1\u978B"
            ],
            effects: [],
            desc: "\u76EE\u6807\u978B\u5177\uFF1A\u8F6F\u80F6\u5E95\u7403\u978B\uFF0C\u89E6\u5730\u9759\u97F3\u5FAE\u6293\u5730\u6469\u64E6\uFF1B\u9A71\u52A8\u8FD0\u52A8\u978B\u811A\u6B65\u58F0"
          },
          shoe_barefoot: {
            id: "shoe_barefoot",
            name: "\u8D64\u811A",
            aliases: [
              "\u8D64\u811A",
              "\u5149\u811A",
              "\u8131\u978B"
            ],
            effects: [],
            desc: "\u76EE\u6807\u72B6\u6001\uFF1A\u8131\u978B\u8D64\u811A\uFF0C\u8089\u638C\u62CD\u51FB\u6E7F\u74F7\u7816/\u5730\u9762\u5FAE\u9ECF\u58F0\uFF1B\u9A71\u52A8\u8D64\u811A\u811A\u6B65\u58F0"
          },
          shoe_slippers: {
            id: "shoe_slippers",
            name: "\u62D6\u978B",
            aliases: [
              "\u62D6\u978B",
              "\u4EBA\u5B57\u62D6"
            ],
            effects: [],
            desc: "\u76EE\u6807\u978B\u5177\uFF1A\u5C45\u5BB6\u62D6\u978B\uFF0C\u556A\u55D2\u62D6\u884C\u58F0\uFF1B\u9A71\u52A8\u62D6\u978B\u811A\u6B65\u58F0"
          },
          shoe_boots: {
            id: "shoe_boots",
            name: "\u9774\u5B50",
            aliases: [
              "\u9774\u5B50",
              "\u76AE\u9774",
              "\u957F\u9774",
              "\u77ED\u9774"
            ],
            effects: [],
            desc: "\u76EE\u6807\u978B\u5177\uFF1A\u91CD\u5E95\u76AE\u9769\u9774\u5B50\uFF0C\u786C\u8D28\u539A\u91CD\u8E0F\u6B65\u58F0\uFF1B\u9A71\u52A8\u9774\u5B50\u811A\u6B65\u58F0"
          },
          shoe_platform: {
            id: "shoe_platform",
            name: "\u677E\u7CD5\u978B",
            aliases: [
              "\u677E\u7CD5\u978B",
              "\u539A\u5E95\u978B"
            ],
            effects: [],
            desc: "\u76EE\u6807\u978B\u5177\uFF1A\u539A\u5E95\u677E\u7CD5\u978B\uFF0C\u949D\u91CD\u6C89\u95F7\u8E0F\u6B65\uFF1B\u9A71\u52A8\u677E\u7CD5\u978B\u811A\u6B65\u58F0"
          },
          shoe_sandals: {
            id: "shoe_sandals",
            name: "\u51C9\u978B",
            aliases: [
              "\u51C9\u978B",
              "\u7ED1\u5E26\u51C9\u978B"
            ],
            effects: [],
            desc: "\u76EE\u6807\u978B\u5177\uFF1A\u590F\u65E5\u7EC6\u5E26\u51C9\u978B\uFF0C\u7EC6\u5E26\u62CD\u811A\u540E\u8DDF\u8F7B\u8106\u788E\u6B65\uFF1B\u9A71\u52A8\u51C9\u978B\u811A\u6B65\u58F0"
          },
          shoe_leather: {
            id: "shoe_leather",
            name: "\u5C0F\u76AE\u978B",
            aliases: [
              "\u5C0F\u76AE\u978B",
              "\u4E50\u798F\u978B",
              "\u76AE\u978B"
            ],
            effects: [],
            desc: "\u76EE\u6807\u978B\u5177\uFF1A\u786C\u771F\u76AE\u5E95\u4E50\u798F\u978B/\u5973\u5F0F\u5355\u978B\uFF0C\u5E72\u7EC3\u6E05\u8106\uFF1B\u9A71\u52A8\u5C0F\u76AE\u978B\u811A\u6B65\u58F0"
          },
          careless: {
            id: "careless",
            name: "\u7C97\u5FC3",
            aliases: [
              "\u7C97\u5FC3",
              "\u9A6C\u864E",
              "\u4E22\u4E09\u843D\u56DB"
            ],
            effects: [],
            desc: "\u76EE\u6807\u7279\u8D28\uFF08pack.traits\uFF09\uFF1A\u5FC3\u4E0D\u5728\u7109\u4E22\u4E09\u843D\u56DB\uFF0C\u5FD8\u9501\u7387+15%\uFF1B\u811A\u672C\u5185\u90E8\u7ED3\u7B97"
          },
          bulky: {
            id: "bulky",
            name: "\u8EAB\u5F62\u9192\u76EE",
            aliases: [
              "\u8EAB\u5F62\u9192\u76EE",
              "\u8EAB\u6750\u9B41\u68A7",
              "\u9AD8\u5927\u663E\u773C"
            ],
            effects: [
              {
                category: "stealth",
                value: -1
              }
            ],
            desc: "\u4F53\u683C\u22658\u9608\u503C\u6807\u7B7E\uFF1A\u8EAB\u6750\u9B41\u68A7\u4E0D\u6613\u9690\u85CF\uFF0C\u9690\u853D\u7C7B-1"
          },
          unobtrusive: {
            id: "unobtrusive",
            name: "\u4E0D\u8D77\u773C",
            aliases: [
              "\u4E0D\u8D77\u773C",
              "\u5E73\u5E73\u65E0\u5947",
              "\u77EE\u5C0F\u7626\u5F31"
            ],
            effects: [
              {
                category: "stealth",
                value: 1
              }
            ],
            desc: "\u4F53\u683C\u22643\u9608\u503C\u6807\u7B7E\uFF1A\u8EAB\u5F62\u77EE\u5C0F\u6613\u6DF7\u5165\u4EBA\u7FA4\uFF0C\u9690\u853D\u7C7B+1"
          },
          light_footed: {
            id: "light_footed",
            name: "\u811A\u6B65\u8F7B",
            aliases: [
              "\u811A\u6B65\u8F7B",
              "\u6B65\u5C65\u8F7B\u76C8",
              "\u65E0\u58F0\u65E0\u606F"
            ],
            effects: [
              {
                category: "stealth",
                value: 2
              }
            ],
            desc: "\u654F\u6377\u22658\u9608\u503C\u6807\u7B7E\uFF1A\u6B65\u5C65\u8F7B\u6377\uFF0C\u9690\u853D\u7C7B+2"
          },
          clumsy: {
            id: "clumsy",
            name: "\u7B28\u62D9",
            aliases: [
              "\u7B28\u62D9",
              "\u52A8\u4F5C\u8FDF\u7F13",
              "\u6BDB\u624B\u6BDB\u811A"
            ],
            effects: [
              {
                category: "stealth",
                value: -2
              }
            ],
            desc: "\u654F\u6377\u22643\u9608\u503C\u6807\u7B7E\uFF1A\u884C\u52A8\u62D6\u6C93\u6613\u5F04\u51FA\u52A8\u9759\uFF0C\u9690\u853D\u7C7B-2"
          },
          stammer: {
            id: "stammer",
            name: "\u7ED3\u5DF4",
            aliases: [
              "\u7ED3\u5DF4",
              "\u8BF4\u8BDD\u7ED3\u5DF4",
              "\u8A00\u8BED\u652F\u543E"
            ],
            effects: [
              {
                category: "social",
                value: -2
              }
            ],
            desc: "\u53E3\u624D\u22642\u4E14\u5FC3\u8DF3>70\u9608\u503C\u6807\u7B7E\uFF1A\u7D27\u5F20\u7ED3\u5DF4\uFF0C\u53E3\u624D\u7C7B-2"
          },
          guarded: {
            id: "guarded",
            name: "\u6162\u70ED",
            type: "personality",
            aliases: [
              "\u6162\u70ED",
              "\u9632\u5907\u5FC3\u91CD",
              "\u751F\u4EBA\u9632\u5907"
            ],
            effects: [
              {
                category: "social",
                value: -2
              }
            ],
            desc: "\u3010\u6027\u683C\xB7\u6162\u70ED\u3011\u9632\u5907\u5FC3\u91CD\uFF0C\u751F\u4EBA\u793E\u4EA4\u4E0E\u642D\u8BDD\u68C0\u5B9A\u4FEE\u6B63 -2"
          },
          stubborn: {
            id: "stubborn",
            name: "\u8981\u5F3A",
            type: "personality",
            aliases: [
              "\u8981\u5F3A",
              "\u81EA\u5C0A\u901E\u5F3A",
              "\u4E0D\u670D\u8F93"
            ],
            effects: [
              {
                category: "conflict",
                value: 1
              }
            ],
            desc: "\u3010\u6027\u683C\xB7\u8981\u5F3A\u3011\u81EA\u5C0A\u901E\u5F3A\uFF0C\u5BDF\u89C9\u5F02\u6837\u5FEB\u6B65\u4E0D\u793A\u5F31\uFF0C\u51B2\u7A81\u5BF9\u6297\u4F53\u683C +1"
          },
          vigilant: {
            id: "vigilant",
            name: "\u8B66\u60D5",
            type: "personality",
            aliases: [
              "\u8B66\u60D5",
              "\u654F\u9510\u597D\u5947",
              "\u8B66\u89C9\u56DE\u5934"
            ],
            effects: [
              {
                category: "acuity",
                value: 1
              }
            ],
            desc: "\u3010\u6027\u683C\xB7\u8B66\u60D5\u3011\u5BF9\u5F02\u54CD\u76F4\u89C9\u654F\u9510\uFF0C\u6709\u6548\u654F\u9510\u6697\u4FEE\u6B63 +1\uFF08\u8B66\u89C9\u589E\u91CF\u591A4%\uFF0C\u8BC6\u8138\u7387\u63D0\u5347\uFF09"
          },
          casual: {
            id: "casual",
            name: "\u968F\u6027",
            type: "personality",
            aliases: [
              "\u968F\u6027",
              "\u968F\u548C",
              "\u6563\u6F2B",
              "\u5927\u5927\u54A7\u54A7"
            ],
            effects: [
              {
                category: "stealth",
                value: 2
              }
            ],
            desc: "\u3010\u6027\u683C\xB7\u968F\u6027\u3011\u968F\u548C\u6563\u6F2B\u7701\u4E8B\u81F3\u4E0A\uFF0C\u6C89\u6D78\u81EA\u8EAB\u8282\u594F\u653E\u7A7A\uFF0C\u5BF9\u52A8\u9759\u8FDF\u949D\uFF0C\u73A9\u5BB6\u9690\u853D +2"
          },
          gentle: {
            id: "gentle",
            name: "\u6E29\u548C",
            type: "personality",
            aliases: [
              "\u6E29\u548C",
              "\u6E29\u67D4",
              "\u987A\u4ECE\u67D4\u5F31"
            ],
            effects: [
              {
                category: "conflict",
                value: -2
              }
            ],
            desc: "\u3010\u6027\u683C\xB7\u6E29\u548C\u3011\u6027\u60C5\u6E29\u548C\u907F\u4E89\u7AEF\uFF0C\u53D7\u5236\u6613\u80A2\u4F53\u50F5\u6EDE\uFF0C\u51B2\u7A81\u9996\u8F6E\u53CD\u6297\u6218\u529B -2"
          },
          introverted: {
            id: "introverted",
            name: "\u5185\u5411",
            type: "personality",
            aliases: [
              "\u5185\u5411",
              "\u817C\u8146",
              "\u5BE1\u8A00",
              "\u5B64\u50FB\u6015\u751F"
            ],
            effects: [
              {
                category: "social",
                value: -2
              }
            ],
            desc: "\u3010\u6027\u683C\xB7\u5185\u5411\u3011\u817C\u8146\u5C11\u8A00\u907F\u751F\u4EBA\uFF0C\u4E60\u60EF\u4F4E\u5934\u72EC\u884C\u907F\u5F00\u89C6\u7EBF\uFF0C\u642D\u8BDD\u4E0E\u4EA4\u6D89\u68C0\u5B9A\u4FEE\u6B63 -2"
          },
          aloof: {
            id: "aloof",
            name: "\u6E05\u51B7",
            type: "personality",
            aliases: [
              "\u6E05\u51B7",
              "\u51B7\u6DE1",
              "\u758F\u79BB",
              "\u72EC\u6765\u72EC\u5F80"
            ],
            effects: [
              {
                category: "sound",
                value: -2
              }
            ],
            desc: "\u3010\u6027\u683C\xB7\u6E05\u51B7\u3011\u72EC\u6765\u72EC\u5F80\u758F\u79BB\u51B7\u6DE1\uFF0C\u72EC\u884C\u5C0F\u9053\u65E0\u63A5\u5E94\uFF0C\u52A8\u9759\u58F0\u6D6A\u521D\u503C -2"
          },
          cheerful: {
            id: "cheerful",
            name: "\u5F00\u6717",
            type: "personality",
            aliases: [
              "\u5F00\u6717",
              "\u6D3B\u6CFC",
              "\u5143\u6C14",
              "\u5927\u65B9"
            ],
            effects: [
              {
                category: "sound",
                value: 3
              }
            ],
            desc: "\u3010\u6027\u683C\xB7\u5F00\u6717\u3011\u6D3B\u6CFC\u5916\u5411\u7CBE\u529B\u5145\u6C9B\uFF0C\u9047\u9669\u53CD\u5E94\u679C\u65AD\u58F0\u7EBF\u6E05\u4EAE\uFF0C\u6562\u4E8E\u547C\u6551\u8D28\u95EE\uFF0C\u58F0\u6D6A +3"
          },
          chic: {
            id: "chic",
            name: "\u7231\u7F8E",
            type: "personality",
            aliases: [
              "\u7231\u7F8E",
              "\u8BB2\u7A76",
              "\u81EA\u604B\u6574\u7406",
              "\u7167\u955C\u5B50"
            ],
            effects: [
              {
                category: "stealth",
                value: 1
              }
            ],
            desc: "\u3010\u6027\u683C\xB7\u7231\u7F8E\u3011\u6CE8\u91CD\u7A7F\u642D\u4EEA\u5BB9\uFF0C\u5E38\u5728\u6A71\u7A97\u524D\u9A7B\u8DB3\u7406\u8863\u7406\u53D1\uFF0C\u5236\u9020\u77ED\u6682\u505C\u987F\u7834\u7EFD\uFF0C\u73A9\u5BB6\u63A5\u8FD1 +1"
          },
          naive: {
            id: "naive",
            name: "\u5355\u7EAF",
            type: "personality",
            aliases: [
              "\u5355\u7EAF",
              "\u5929\u771F",
              "\u4E0D\u8BBE\u9632",
              "\u8F7B\u4FE1"
            ],
            effects: [
              {
                category: "social",
                value: 2
              }
            ],
            desc: "\u3010\u6027\u683C\xB7\u5355\u7EAF\u3011\u5FC3\u601D\u7B80\u5355\u7F3A\u5C11\u6212\u5907\uFF0C\u8B66\u60D5\u5EFA\u7ACB\u6162\uFF0C\u642D\u8BDD\u4E0E\u95EE\u8DEF\u4EA4\u6D89\u4FEE\u6B63 +2"
          },
          window_pause: {
            id: "window_pause",
            name: "\u80F6\u7247\u63A2\u5E97",
            type: "hobby",
            aliases: [
              "\u80F6\u7247\u63A2\u5E97",
              "\u6A71\u7A97\u9A7B\u8DB3",
              "\u63A2\u5E97\u770B\u6A71\u7A97"
            ],
            effects: [
              {
                category: "stealth",
                value: 1
              }
            ],
            desc: "\u3010\u7231\u597D\xB7\u80F6\u7247\u63A2\u5E97\u3011\u5E38\u5728\u8857\u89D2\u6A71\u7A97\u505C\u987F\u53D6\u666F\uFF0C\u5C3E\u968F\u8FD1\u8EAB\u68C0\u5B9A +1"
          },
          sound_muffled: {
            id: "sound_muffled",
            name: "\u5927\u8033\u9EA6",
            type: "hobby",
            aliases: [
              "\u5927\u8033\u9EA6",
              "\u964D\u566A\u8033\u9EA6",
              "\u542C\u6B4C\u5206\u795E"
            ],
            effects: [
              {
                category: "stealth",
                value: 1
              }
            ],
            desc: "\u3010\u7231\u597D\xB7\u5927\u8033\u9EA6\u3011\u4E60\u60EF\u6234\u5927\u8033\u9EA6\u542C\u6B4C\uFF0C\u542C\u89C9\u8FDF\u949D\uFF0C\u73A9\u5BB6\u9690\u853D +1\uFF0C\u58F0\u6D6A\u9608\u503C -3"
          },
          bag_rummage: {
            id: "bag_rummage",
            name: "\u624B\u8D26",
            type: "hobby",
            aliases: [
              "\u624B\u8D26",
              "\u7FFB\u5305",
              "\u7FFB\u627E\u624B\u8D26",
              "\u6574\u7406\u7968\u636E"
            ],
            effects: [
              {
                category: "stealth",
                value: 1
              }
            ],
            desc: "\u3010\u7231\u597D\xB7\u624B\u8D26\u3011\u5E38\u5728\u8DEF\u53E3\u9A7B\u8DB3\u7FFB\u5305\u627E\u5F69\u58A8\u7B14\u4E0E\u7968\u636E\uFF0C\u63D0\u4F9B\u80CC\u8EAB\u7834\u7EFD\u7A97\u53E3"
          },
          aroma_trace: {
            id: "aroma_trace",
            name: "\u9999\u6C1B",
            type: "hobby",
            aliases: [
              "\u9999\u6C1B",
              "\u968F\u8EAB\u9999\u6C34",
              "\u6DE1\u6DE1\u9999\u6C14"
            ],
            effects: [
              {
                category: "acuity",
                value: 0
              }
            ],
            desc: "\u3010\u7231\u597D\xB7\u9999\u6C1B\u3011\u6162\u8DD1\u66F4\u8863\u5907\u6709\u9999\u6C1B\u5C0F\u6837\uFF0C\u6563\u53D1\u5FAE\u9999\uFF0C\u8FD1\u8DDD\u79BB\u55C5\u89C9\u8BC6\u522B\u7EBF\u7D22"
          },
          bag_heavy: {
            id: "bag_heavy",
            name: "\u65E7\u4E66",
            type: "hobby",
            aliases: [
              "\u65E7\u4E66",
              "\u5305\u91CD",
              "\u539A\u91CD\u4E66\u672C",
              "\u8D1F\u91CD\u7D2F\u8D58"
            ],
            effects: [
              {
                category: "conflict",
                value: -1
              }
            ],
            desc: "\u3010\u7231\u597D\xB7\u65E7\u4E66\u3011\u5E06\u5E03\u5305\u5185\u538B\u7740\u501F\u9605\u65E7\u4E66\uFF0C\u8D1F\u91CD\u62D6\u7D2F\uFF0C\u8FFD\u9010\u5954\u8DD1\u654F\u6377\u5BF9\u6297 -1"
          },
          bench_still: {
            id: "bench_still",
            name: "\u901F\u5199",
            type: "hobby",
            aliases: [
              "\u901F\u5199",
              "\u957F\u6905\u753B\u753B",
              "\u8857\u5934\u901F\u5199",
              "\u9759\u5750\u753B\u666F"
            ],
            effects: [
              {
                category: "stealth",
                value: 2
              }
            ],
            desc: "\u3010\u7231\u597D\xB7\u901F\u5199\u3011\u5E38\u5728\u8DEF\u706F\u957F\u6905\u9759\u5750\u753B\u8857\u666F\uFF0C\u5904\u4E8E\u9759\u6B62\u72B6\u6001\uFF0C\u5C3E\u968F\u9760\u8FD1\u514D\u9664\u79FB\u52A8\u68C0\u5B9A"
          }
        },
        entries: [
          {
            id: "follow",
            name: "\u8DDF\u7F00",
            args: [
              "dist"
            ],
            check: "follow",
            cost: {
              tax: "heart_seg"
            },
            modes: [
              "stealth"
            ],
            aliases: [
              "\u5C3E\u968F",
              "\u8DDF\u8E2A"
            ]
          },
          {
            id: "approach",
            name: "\u8D34\u8FD1",
            args: [
              "dist"
            ],
            check: null,
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "withdraw",
            name: "\u62C9\u8FDC",
            args: [
              "dist"
            ],
            check: "withdraw",
            modes: [
              "stealth"
            ],
            requires: {
              dist: [
                "same",
                "close",
                "touch"
              ]
            },
            aliases: [
              "\u540E\u64A4"
            ]
          },
          {
            id: "hide",
            name: "\u8EB2\u85CF",
            args: [],
            check: "hide",
            modes: [
              "stealth"
            ],
            requires: {
              dist: [
                "far",
                "same",
                "close"
              ]
            },
            aliases: [
              "\u9690\u853D"
            ]
          },
          {
            id: "wall",
            name: "\u8D34\u5899\u9690\u533F",
            args: [],
            check: null,
            modes: [
              "stealth"
            ],
            aliases: [
              "\u8D34\u5899"
            ]
          },
          {
            id: "breath",
            name: "\u7F13\u606F",
            args: [],
            check: null,
            modes: [
              "any"
            ],
            aliases: [
              "\u6DF1\u547C\u5438"
            ]
          },
          {
            id: "ambush",
            name: "\u62A2\u5148\u57CB\u4F0F",
            args: [
              "route"
            ],
            check: null,
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "enter_tail",
            name: "\u5C3E\u968F\u8FDB\u697C",
            args: [],
            check: "follow",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "stop",
            name: "\u505C\u6B65",
            args: [],
            check: null,
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "wait",
            name: "\u7B49\u5F85\u9A7B\u8DB3",
            args: [],
            check: null,
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "cross",
            name: "\u6A2A\u7A7F\u6362\u8FB9",
            args: [],
            check: null,
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "cover",
            name: "\u501F\u7269\u63A9\u62A4",
            args: [
              "cover"
            ],
            check: null,
            modes: [
              "stealth"
            ],
            aliases: [
              "\u501F\u7269"
            ]
          },
          {
            id: "fake_phone",
            name: "\u5047\u88C5\u7528\u624B\u673A",
            args: [],
            check: null,
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "fake_call",
            name: "\u5047\u88C5\u901A\u8BDD",
            args: [],
            check: "fake_call",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "shop_enter",
            name: "\u4F6F\u88C5\u8FDB\u5E97",
            args: [],
            check: "shop_enter",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "window_watch",
            name: "\u6A71\u7A97\u53CD\u5C04",
            args: [],
            check: null,
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "cafe_sit",
            name: "\u5165\u5EA7\u76D1\u89C6",
            args: [],
            check: null,
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "record",
            name: "\u5F55\u97F3",
            args: [],
            check: "record",
            modes: [
              "stealth",
              "contact"
            ],
            aliases: []
          },
          {
            id: "note",
            name: "\u8BB0\u5F55\u65E5\u7A0B",
            args: [],
            check: null,
            modes: [
              "any"
            ],
            aliases: []
          },
          {
            id: "plate",
            name: "\u8BB0\u8F66\u724C",
            args: [],
            check: "plate",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "trash",
            name: "\u67E5\u5783\u573E",
            args: [],
            check: "trash",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "pick",
            name: "\u6361\u62FE",
            args: [],
            check: "pick",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "perch",
            name: "\u767B\u9AD8\u89C2\u5BDF",
            args: [],
            check: "perch",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "listen_home",
            name: "\u697C\u4E0B\u542C\u52A8\u9759",
            args: [],
            check: "listen_home",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "stakeout_wait",
            name: "\u5B9A\u70B9\u8E72\u5B88",
            args: [
              "spot"
            ],
            check: null,
            modes: [
              "stealth",
              "prepare"
            ],
            aliases: []
          },
          {
            id: "disguise",
            name: "\u6362\u88C5",
            args: [
              "item"
            ],
            check: null,
            modes: [
              "prepare"
            ],
            aliases: []
          },
          {
            id: "gait",
            name: "\u53D8\u6362\u6B65\u6001",
            args: [],
            check: null,
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "abort",
            name: "\u4E2D\u65AD\u79BB\u5F00",
            args: [],
            check: null,
            modes: [
              "stealth"
            ],
            aliases: [
              "\u64A4\u79BB"
            ]
          },
          {
            id: "photo",
            name: "\u62CD\u7167",
            args: [],
            check: "photo",
            modes: [
              "stealth",
              "contact"
            ],
            aliases: []
          },
          {
            id: "scan",
            name: "\u6253\u91CF",
            args: [
              "dim"
            ],
            check: "scan",
            modes: [
              "stealth",
              "contact"
            ],
            aliases: []
          },
          {
            id: "deduce",
            name: "\u5206\u6790",
            args: [],
            check: "deduce",
            modes: [
              "any"
            ],
            aliases: []
          },
          {
            id: "timing",
            name: "\u8BFB\u65F6\u673A",
            args: [],
            check: "timing",
            modes: [
              "stealth",
              "contact"
            ],
            aliases: []
          },
          {
            id: "listen",
            name: "\u8D34\u8EAB\u542C",
            args: [],
            check: "listen",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "greet",
            name: "\u5BD2\u6684",
            args: [],
            check: "greet",
            modes: [
              "contact"
            ],
            aliases: []
          },
          {
            id: "chat",
            name: "\u642D\u8BDD",
            args: [
              "cdist"
            ],
            check: "chat",
            modes: [
              "contact"
            ],
            aliases: [
              "\u642D\u8BAA"
            ]
          },
          {
            id: "ease",
            name: "\u6D88\u7591\u642D\u8BDD",
            args: [],
            check: "ease",
            modes: [
              "contact"
            ],
            aliases: []
          },
          {
            id: "misdirection",
            name: "\u8BEF\u5BFC\u5F52\u56E0",
            args: [],
            check: "ease",
            modes: [
              "contact"
            ],
            aliases: []
          },
          {
            id: "help",
            name: "\u9012\u7269\u5E2E\u5FD9",
            args: [
              "ticket"
            ],
            check: null,
            modes: [
              "contact"
            ],
            aliases: []
          },
          {
            id: "check_visit",
            name: "\u4E0A\u95E8\u68C0\u67E5",
            args: [
              "pretext"
            ],
            check: null,
            modes: [
              "contact"
            ],
            aliases: []
          },
          {
            id: "strike",
            name: "\u4E0B\u624B",
            args: [
              "style"
            ],
            check: null,
            modes: [
              "any"
            ],
            requires: {
              dist: [
                "touch",
                "close"
              ]
            },
            aliases: [
              "\u5077\u88AD",
              "\u5F3A\u653B"
            ]
          },
          {
            id: "barrier",
            name: "\u8BBE\u969C",
            args: [
              "obstacle"
            ],
            check: "barrier",
            modes: [
              "any"
            ],
            aliases: []
          },
          {
            id: "pry",
            name: "\u64AC\u95E8",
            args: [],
            check: "pry",
            modes: [
              "any"
            ],
            requires: {
              place: "door",
              dist: [
                "close",
                "touch"
              ]
            },
            aliases: []
          },
          {
            id: "climb",
            name: "\u7FFB\u5899",
            args: [],
            check: "climb",
            modes: [
              "any"
            ],
            requires: {
              dist: [
                "close",
                "touch"
              ]
            },
            aliases: []
          },
          {
            id: "drag",
            name: "\u8F6C\u79FB",
            args: [],
            check: "drag",
            modes: [
              "any"
            ],
            requires: {
              dist: [
                "touch"
              ]
            },
            aliases: []
          },
          {
            id: "pin",
            name: "\u6309\u5236",
            args: [],
            check: null,
            modes: [
              "any"
            ],
            requires: {
              dist: [
                "touch"
              ]
            },
            aliases: []
          },
          {
            id: "chase",
            name: "\u8FFD\u9010",
            args: [],
            check: null,
            modes: [
              "any"
            ],
            aliases: []
          },
          {
            id: "work",
            name: "\u6253\u5DE5",
            args: [],
            check: null,
            modes: [
              "prepare"
            ],
            aliases: []
          },
          {
            id: "buy",
            name: "\u8D2D\u7269",
            args: [
              "item"
            ],
            check: null,
            modes: [
              "prepare"
            ],
            aliases: []
          },
          {
            id: "stakeout",
            name: "\u8E72\u70B9",
            args: [
              "spot"
            ],
            check: "stakeout",
            modes: [
              "prepare"
            ],
            aliases: []
          },
          {
            id: "spot",
            name: "\u5237\u8138",
            args: [
              "scene"
            ],
            check: null,
            modes: [
              "prepare"
            ],
            aliases: []
          },
          {
            id: "rest",
            name: "\u4F11\u606F",
            args: [],
            check: null,
            modes: [
              "prepare"
            ],
            aliases: []
          },
          {
            id: "locate",
            name: "\u5B9A\u4F4D\u4F4F\u5904",
            args: [],
            check: "locate",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "watch_lights",
            name: "\u89C2\u706F",
            args: [],
            check: null,
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "check_mailbox",
            name: "\u67E5\u4FE1\u7BB1",
            args: [],
            check: "mailbox",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "watch_visitor",
            name: "\u67E5\u8BBF\u5BA2",
            args: [],
            check: null,
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "check_camera",
            name: "\u67E5\u76D1\u63A7\u4F4D",
            args: [],
            check: "camera",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "check_door",
            name: "\u67E5\u95E8\u7981",
            args: [],
            check: "door",
            modes: [
              "stealth"
            ],
            requires: {
              place: "door",
              dist: [
                "close",
                "touch"
              ]
            },
            aliases: []
          },
          {
            id: "stair_lurk",
            name: "\u697C\u9053\u6F5C\u4F0F",
            args: [],
            check: "lurk",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "door_listen",
            name: "\u8D34\u95E8\u542C",
            args: [],
            check: "dlisten",
            modes: [
              "stealth"
            ],
            requires: {
              place: "door",
              dist: [
                "close",
                "touch"
              ]
            },
            aliases: []
          },
          {
            id: "door_peep",
            name: "\u95E8\u7F1D\u89C2\u5BDF",
            args: [],
            check: "peep",
            modes: [
              "stealth"
            ],
            requires: {
              place: "door",
              dist: [
                "close",
                "touch"
              ]
            },
            aliases: []
          },
          {
            id: "try_handle",
            name: "\u8BD5\u95E8\u628A",
            args: [],
            check: "handle",
            modes: [
              "stealth"
            ],
            requires: {
              place: "door",
              dist: [
                "close",
                "touch"
              ]
            },
            aliases: []
          },
          {
            id: "lockpick",
            name: "\u5F00\u9501",
            args: [
              "tool"
            ],
            check: "lockpick",
            modes: [
              "any"
            ],
            requires: {
              place: "door",
              dist: [
                "close",
                "touch"
              ],
              items: [
                "lockpick",
                "cyber_lockpick"
              ]
            },
            aliases: []
          },
          {
            id: "break_in",
            name: "\u5165\u5BA4",
            args: [],
            check: null,
            modes: [
              "any"
            ],
            aliases: []
          },
          {
            id: "ransack",
            name: "\u7FFB\u627E",
            args: [
              "area"
            ],
            check: "ransack",
            modes: [
              "any"
            ],
            requires: {
              dist: [
                "close",
                "touch"
              ]
            },
            aliases: []
          },
          {
            id: "plant_bug",
            name: "\u5B89\u88C5\u76D1\u89C6",
            args: [
              "device"
            ],
            check: "bug",
            modes: [
              "any"
            ],
            aliases: []
          },
          {
            id: "cover_tracks",
            name: "\u6E05\u7406\u75D5\u8FF9",
            args: [],
            check: "tracks",
            modes: [
              "any"
            ],
            aliases: []
          },
          {
            id: "plan_exit",
            name: "\u8BB0\u64A4\u79BB\u8DEF\u7EBF",
            args: [],
            check: "exit",
            modes: [
              "any"
            ],
            aliases: []
          },
          {
            id: "wait_gate",
            name: "\u8E72\u5B88\u51FA\u53E3",
            args: [],
            check: null,
            modes: [
              "stealth",
              "prepare"
            ],
            aliases: []
          },
          {
            id: "ride_along",
            name: "\u901A\u52E4\u540C\u8F66",
            args: [
              "cabin"
            ],
            check: "follow",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "transfer",
            name: "\u6362\u4E58\u8DDF\u8FDB",
            args: [],
            check: "transfer",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "watch_peers",
            name: "\u89C2\u5BDF\u540C\u4FAA",
            args: [],
            check: "peers",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "fake_visit",
            name: "\u4F2A\u88C5\u8BBF\u5BA2",
            args: [
              "identity"
            ],
            check: "visit",
            modes: [
              "contact"
            ],
            aliases: []
          },
          {
            id: "audit_class",
            name: "\u4F2A\u88C5\u65C1\u542C",
            args: [],
            check: "audit",
            modes: [
              "any"
            ],
            aliases: []
          },
          {
            id: "lobby_lurk",
            name: "\u5927\u5802\u6F5C\u4F0F",
            args: [],
            check: "lobby",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "canteen_watch",
            name: "\u98DF\u5802\u76D1\u89C6",
            args: [],
            check: null,
            modes: [
              "contact"
            ],
            aliases: []
          },
          {
            id: "apply_job",
            name: "\u4F2A\u88C5\u5E94\u8058",
            args: [],
            check: "apply",
            modes: [
              "contact"
            ],
            aliases: []
          },
          {
            id: "check_desk",
            name: "\u67E5\u5DE5\u724C\u5DE5\u4F4D",
            args: [],
            check: "desk",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "hear_gossip",
            name: "\u542C\u540C\u4E8B\u8C08",
            args: [],
            check: "gossip",
            modes: [
              "contact",
              "stealth"
            ],
            aliases: []
          },
          {
            id: "follow_work",
            name: "\u53CD\u5411\u901A\u52E4",
            args: [],
            check: "follow",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "stalk_social",
            name: "\u67E5\u793E\u4EA4",
            args: [
              "platform"
            ],
            check: "social",
            modes: [
              "prepare",
              "any"
            ],
            aliases: []
          },
          {
            id: "monitor_social",
            name: "\u5173\u6CE8\u52A8\u6001",
            args: [],
            check: null,
            modes: [
              "any"
            ],
            aliases: []
          },
          {
            id: "plant_gps",
            name: "\u7535\u5B50\u8FFD\u8E2A",
            args: [
              "device"
            ],
            check: "gps",
            modes: [
              "any"
            ],
            aliases: []
          },
          {
            id: "check_parcel",
            name: "\u67E5\u5FEB\u9012",
            args: [],
            check: "parcel",
            modes: [
              "any"
            ],
            aliases: []
          },
          {
            id: "get_number",
            name: "\u62FC\u53F7\u7801",
            args: [],
            check: "number",
            modes: [
              "any"
            ],
            aliases: []
          },
          {
            id: "pump_person",
            name: "\u5957\u8BDD\u7B2C\u4E09\u65B9",
            args: [
              "target"
            ],
            check: "pump",
            modes: [
              "contact"
            ],
            aliases: []
          },
          {
            id: "bribe",
            name: "\u4E70\u901A",
            args: [
              "target"
            ],
            check: null,
            modes: [
              "contact",
              "prepare"
            ],
            aliases: []
          },
          {
            id: "ride_follow",
            name: "\u9A91\u884C\u8DDF\u7F00",
            args: [],
            check: "ride_follow",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "car_follow",
            name: "\u9A7E\u8F66\u8DDF\u8E2A",
            args: [],
            check: "car_follow",
            modes: [
              "stealth"
            ],
            aliases: []
          },
          {
            id: "respond_her",
            name: "\u56DE\u5E94\u5979\u7684\u642D\u8BDD",
            args: [
              "ctx"
            ],
            check: null,
            modes: [
              "contact"
            ],
            aliases: []
          },
          {
            id: "answer_guard",
            name: "\u5E94\u5BF9\u76D8\u95EE",
            args: [
              "target"
            ],
            check: "guard",
            modes: [
              "contact"
            ],
            aliases: []
          },
          {
            id: "stage_scene",
            name: "\u5E03\u7F6E\u73B0\u573A",
            args: [],
            check: "stage",
            modes: [
              "prepare",
              "any"
            ],
            aliases: []
          },
          {
            id: "press_close",
            name: "\u7AD9\u4F4D\u8D34\u8FD1",
            args: [],
            check: null,
            modes: [
              "vehicle"
            ],
            aliases: []
          },
          {
            id: "brace_touch",
            name: "\u501F\u4F4D\u63A5\u89E6",
            args: [],
            check: "brace",
            modes: [
              "vehicle"
            ],
            aliases: []
          },
          {
            id: "grope",
            name: "\u9694\u8863\u89E6\u629A",
            args: [
              "part"
            ],
            check: "grope",
            modes: [
              "vehicle"
            ],
            aliases: []
          },
          {
            id: "escalate",
            name: "\u5F97\u5BF8\u8FDB\u5C3A",
            args: [],
            check: "escalate",
            modes: [
              "vehicle"
            ],
            aliases: []
          },
          {
            id: "alight_follow",
            name: "\u4E0B\u8F66\u540C\u968F",
            args: [],
            check: "alight_follow",
            modes: [
              "vehicle"
            ],
            aliases: []
          },
          {
            id: "car_shift",
            name: "\u8F66\u53A2\u6362\u4F4D",
            args: [
              "dir"
            ],
            check: "shift",
            modes: [
              "vehicle"
            ],
            aliases: []
          }
        ]
      };
    }
  });

  // src/runtime/lexicon.js
  var require_lexicon2 = __commonJS({
    "src/runtime/lexicon.js"(exports, module) {
      var R = require_rules();
      var RAW = require_lexicon();
      function loadLexicon(raw = RAW, rules = R) {
        const errors = [];
        const byId = /* @__PURE__ */ new Map();
        const byName = /* @__PURE__ */ new Map();
        const byAlias = /* @__PURE__ */ new Map();
        const validModes = new Set(raw.modes);
        raw.entries.forEach((e, i) => {
          const at = `entries[${i}](${e.id || "?"})`;
          if (!e.id || !e.name) {
            errors.push(`${at}: \u7F3A id/name`);
            return;
          }
          if (byId.has(e.id)) errors.push(`${at}: id \u91CD\u590D`);
          else byId.set(e.id, e);
          const nKey = String(e.name).trim().toLowerCase();
          if (byName.has(nKey)) errors.push(`${at}: name "${e.name}" \u91CD\u590D`);
          else byName.set(nKey, e);
          const modes = e.modes || ["any"];
          for (const m of modes) if (!validModes.has(m)) errors.push(`${at}: \u975E\u6CD5\u6A21\u5F0F ${m}`);
          if (e.check !== null && e.check !== void 0 && !(e.check in rules.checks))
            errors.push(`${at}: check "${e.check}" \u4E0D\u5728 rules.checks`);
          for (const a of e.aliases || []) {
            if (byAlias.has(a)) errors.push(`\u522B\u540D\u51B2\u7A81: "${a}" \u540C\u65F6\u5C5E\u4E8E ${byAlias.get(a)} \u4E0E ${e.id}`);
            else byAlias.set(a, e.id);
          }
        });
        if (errors.length) {
          const err = new Error("\u8BCD\u8868\u6821\u9A8C\u5931\u8D25:\n  " + errors.join("\n  "));
          err.details = errors;
          throw err;
        }
        return { entries: raw.entries, byId, byName, byAlias, argKeys: raw.argKeys, defaultArgs: raw.defaultArgs };
      }
      function normalize(text, lex) {
        const t = String(text || "").trim().toLowerCase();
        if (!t) return { hit: false, degraded: true, sample: text };
        const head = t.split(/[\s|｜]+/)[0];
        let e = lex.byName && lex.byName.get(head) || lex.byId && lex.byId.get(head);
        if (e) {
          return { hit: true, id: e.id, name: e.name, args: parseArgs(e, text, lex) };
        }
        if (lex.byAlias && lex.byAlias.has(head)) {
          const id = lex.byAlias.get(head);
          const item = lex.byId.get(id);
          if (item) {
            return { hit: true, id: item.id, name: item.name, args: parseArgs(item, text, lex) };
          }
        }
        if (t !== head) {
          e = lex.byName && lex.byName.get(t) || lex.byId && lex.byId.get(t);
          if (e) {
            return { hit: true, id: e.id, name: e.name, args: parseArgs(e, text, lex) };
          }
          if (lex.byAlias && lex.byAlias.has(t)) {
            const id = lex.byAlias.get(t);
            const item = lex.byId.get(id);
            if (item) {
              return { hit: true, id: item.id, name: item.name, args: parseArgs(item, text, lex) };
            }
          }
        }
        return { hit: false, degraded: true, sample: String(text).slice(0, 40) };
      }
      function parseArgs(entry, text, lex) {
        const out = {};
        const words = String(text).toLowerCase().split(/[\s,，、]+/);
        for (const arg of entry.args || []) {
          const keymap = lex.argKeys[arg];
          if (!keymap) continue;
          let found = null;
          for (const val of Object.keys(keymap)) {
            if (words.includes(val)) {
              found = val;
              break;
            }
          }
          if (!found) {
            for (const [val, ws] of Object.entries(keymap)) {
              if (ws.some((w) => text.includes(w))) {
                found = val;
                break;
              }
            }
          }
          if (!found) {
            const def = lex.defaultArgs[entry.id];
            found = def && def[arg] ? def[arg] : null;
          }
          if (found) out[arg] = found;
        }
        return out;
      }
      module.exports = { loadLexicon, normalize, parseArgs };
    }
  });

  // src/runtime/parse.js
  var require_parse = __commonJS({
    "src/runtime/parse.js"(exports, module) {
      var { normalize, loadLexicon } = require_lexicon2();
      var TAG_RE = /<(动作|事实|谎言|模式)>([\s\S]*?)<\/\1>/g;
      var MODE_WORDS = {
        "prepare": "prepare",
        "\u51C6\u5907": "prepare",
        "stealth": "stealth",
        "\u6F5C\u884C": "stealth",
        "contact": "contact",
        "\u63A5\u89E6": "contact",
        "vehicle": "vehicle",
        "\u8F66\u53A2": "vehicle"
      };
      var VERIF_WORDS = { "high": "high", "\u9AD8": "high", "mid": "mid", "\u4E2D": "mid", "low": "low", "\u4F4E": "low" };
      var ACTION_QUEUE_MAX = 3;
      function splitSegs(body, diag) {
        if (body.includes("|")) diag.halfWidthPipe++;
        return body.split(/[｜|]/).map((s) => s.trim()).filter(Boolean);
      }
      function parseFloor(text, lex) {
        const L = lex || loadLexicon();
        const diag = {
          parseErrors: 0,
          halfWidthPipe: 0,
          actionOverflow: 0,
          degradedSamples: [],
          factBad: 0,
          lieBad: 0,
          modeBad: 0,
          modeDup: 0,
          unknownAction: []
        };
        const tags = [];
        let actionCount = 0, modeCount = 0;
        const src = String(text || "");
        TAG_RE.lastIndex = 0;
        let m;
        while ((m = TAG_RE.exec(src)) !== null) {
          const [full, kind, body] = m;
          try {
            if (kind === "\u52A8\u4F5C") {
              if (actionCount >= ACTION_QUEUE_MAX) {
                diag.actionOverflow++;
                continue;
              }
              const r = normalize(splitSegs(body, diag).join(" "), L);
              if (!r.hit) {
                diag.parseErrors++;
                diag.unknownAction.push(body.slice(0, 24));
                continue;
              }
              actionCount++;
              tags.push({ type: "action", id: r.id, name: r.name, args: r.args });
            } else if (kind === "\u4E8B\u5B9E") {
              const segs = splitSegs(body, diag);
              const tm = /^#(\d+)$/.exec(segs[0] || "");
              if (!tm) {
                diag.factBad++;
                continue;
              }
              tags.push({ type: "fact", ticket: Number(tm[1]) });
            } else if (kind === "\u8C0E\u8A00") {
              const segs = splitSegs(body, diag);
              if (segs.length < 4) {
                diag.lieBad++;
                continue;
              }
              const v = VERIF_WORDS[segs[3].toLowerCase()] || null;
              if (!v) {
                diag.lieBad++;
                continue;
              }
              tags.push({ type: "lie", claim: segs[0], to: segs[1], scene: segs[2], verifiability: v });
            } else if (kind === "\u6A21\u5F0F") {
              const val = MODE_WORDS[body.trim().toLowerCase()] || MODE_WORDS[body.trim()];
              if (!val) {
                diag.modeBad++;
                continue;
              }
              if (modeCount >= 1) {
                diag.modeDup++;
                continue;
              }
              modeCount++;
              tags.push({ type: "mode", mode: val });
            }
          } catch (_) {
            diag.parseErrors++;
          }
        }
        const cleanText = src.replace(TAG_RE, "").trim();
        return { tags, cleanText, diag };
      }
      function verifyEvidence(cleanText, claim) {
        if (!claim || !cleanText) return false;
        return cleanText.includes(claim);
      }
      module.exports = { parseFloor, verifyEvidence, ACTION_QUEUE_MAX };
    }
  });

  // src/runtime/tags.js
  var require_tags = __commonJS({
    "src/runtime/tags.js"(exports, module) {
      var CAPS = { stealth: 6, fine: 4, conflict: 5, social: 5 };
      function apply(stack, tag) {
        const same = stack.find((t) => t.id === tag.id);
        if (same) {
          if (tag.duration.type === "flag") same.duration = { type: "flag" };
          else if (tag.duration.type === "scene")
            same.duration.count = Math.max(same.duration.count || 0, tag.duration.count);
          if (tag.type && !same.type) same.type = tag.type;
          return stack;
        }
        stack.push({
          id: tag.id,
          name: tag.name,
          owner: tag.owner,
          type: tag.type || "status",
          category: tag.category,
          effects: (tag.effects || []).slice(),
          duration: { ...tag.duration }
        });
        return stack;
      }
      function remove(stack, id) {
        const i = stack.findIndex((t) => t.id === id);
        if (i >= 0) stack.splice(i, 1);
        return stack;
      }
      function tick(stack) {
        for (let i = stack.length - 1; i >= 0; i--) {
          const t = stack[i];
          if (t.duration.type === "scene") {
            if (--t.duration.count <= 0) stack.splice(i, 1);
          }
        }
        return stack;
      }
      function clearNight(stack) {
        return stack.filter((t) => t.duration.type === "flag");
      }
      function summarize(stack, category) {
        const hits = [];
        for (const t of stack) {
          for (const e of t.effects) {
            if (e.category === category) hits.push({ src: t.name, owner: t.owner, v: e.value });
          }
        }
        let sum = hits.reduce((s, h) => s + h.v, 0);
        const cap = CAPS[category];
        let capped = false;
        if (sum > cap) {
          sum = cap;
          capped = true;
        }
        if (sum < -cap) {
          sum = -cap;
          capped = true;
        }
        return { sum, capped, breakdown: hits };
      }
      var PITY_BONUS = 3;
      module.exports = { apply, remove, tick, clearNight, summarize, CAPS, PITY_BONUS };
    }
  });

  // src/runtime/checks.js
  var require_checks = __commonJS({
    "src/runtime/checks.js"(exports, module) {
      var R = require_rules();
      function d20Check({ d20, attr, mods = [], dc, stealth = false }) {
        const modSum = mods.reduce((s, m) => s + m.v, 0);
        const total = d20 + attr + modSum;
        const margin = total - dc;
        let band;
        if (d20 === 1) band = "nat1";
        else if (d20 === 20) band = "nat20";
        else if (margin >= 0) band = "success";
        else if (stealth && margin >= -R.check.graceMargin) band = "grace";
        else band = "fail";
        return { total, margin, band };
      }
      function applyAdvDis(roll1, roll2, mode) {
        if (mode === "adv") {
          const d20 = roll1 === 20 || roll2 === 20 ? 20 : roll1 === 1 || roll2 === 1 ? 1 : Math.max(roll1, roll2);
          return { d20, raw: [roll1, roll2] };
        }
        if (mode === "dis") return { d20: Math.min(roll1, roll2), raw: [roll1, roll2] };
        return { d20: roll1, raw: [roll1] };
      }
      function pityBonus(consecFails) {
        return consecFails >= 2 ? 3 : 0;
      }
      function heartCoeff(nrv) {
        return R.heart.coeffBase - nrv * R.heart.coeffPerNrv;
      }
      function heartDelta({ stim, nrv }) {
        return Math.round(stim * heartCoeff(nrv));
      }
      function heartBaseline() {
        return R.heart.baseline;
      }
      function breathGain(nrv) {
        return Math.max(R.heart.breathBase + (nrv - 5) * R.heart.breathPerNrv, R.heart.breathMin);
      }
      function segHeartDrop(current, nrv) {
        const base = heartBaseline();
        return Math.max(current - R.heart.segDrop, Math.min(current, base));
      }
      function breathFloor(current, gain) {
        return Math.max(current - gain, Math.min(current, R.heart.floor));
      }
      function heartCap(v) {
        return Math.min(v, R.heart.cap);
      }
      function staminaSegTax(heartPeak, sweetHigh = R.check.sweetHigh) {
        if (heartPeak >= R.heart.crashLine) return -R.stamina.segTax.crash;
        if (heartPeak > sweetHigh) return -R.stamina.segTax.deform;
        if (heartPeak >= R.check.sweetLow) return -R.stamina.segTax.sweet;
        return -R.stamina.segTax.calm;
      }
      function faceMemGain({ context = "stealth", band = null }) {
        if (context === "social") return 2;
        if (["locked", "conflict", "gaze"].includes(context)) return 2;
        if (band === "grace") return 1;
        if (band === "nat1") return 2;
        return 0;
      }
      function faceAssociate({ d20, acuity, memCells = 0, cover = 0, bodyMod = 0 }) {
        const coeff = Math.min(R.check.identifyMemMax ?? 1, memCells * (R.check.identifyMemCoeff ?? 0.05));
        const total = Math.floor((d20 + acuity + bodyMod) * coeff);
        const dc = 10 + Math.min(cover, R.check.coverCap);
        return { total, dc, hit: total >= dc, coeff };
      }
      function heartLines(current, sweetHigh = R.check.sweetHigh) {
        const sweet = current >= R.check.sweetLow && current <= sweetHigh;
        const deform = current >= R.heart.deformLine ? -2 : 0;
        return { sweet, deform, crash: current >= R.heart.crashLine };
      }
      function acuityCoeff(acuity) {
        return R.alert.acuityBase + acuity * R.alert.acuityPer;
      }
      function alertDelta({ threat, dist, env, acuity, familiar = false }) {
        const t = R.alert.threat[threat] ?? 0;
        const d = R.alert.distFactor[dist] ?? 1;
        let e = R.alert.envFactor[env] ?? 1;
        if (familiar) e *= R.alert.familiarCoeff;
        return Math.round(t * d * e * acuityCoeff(acuity));
      }
      function alertStage(alert) {
        const b = R.alert.bands;
        if (alert >= b.react) return 4;
        if (alert >= b.confirmed) return 3;
        if (alert >= b.suspicious) return 2;
        if (alert >= b.uneasy) return 1;
        return 0;
      }
      function nightStartAlert(slot, wariness) {
        return Math.round((R.alert.nightBase[slot] ?? 0) + wariness / 5);
      }
      function warinessGain(peakAlert) {
        return Math.round(Math.max(0, peakAlert - 50) / 4);
      }
      function conflictPower({ str, agi, dice, opp = 3, firstStrike = false, training = 0 }) {
        const base = str * R.conflict.strWeight + agi * R.conflict.agiWeight;
        const oppMod = R.conflict.oppMods[opp] ?? 0;
        return base + dice + oppMod + (firstStrike ? R.conflict.firstStrike : 0) + training;
      }
      function conflictModsSelf({ heart, firstStrike = false }) {
        return (heart > R.conflict.highHeartLine ? R.conflict.highHeartPenalty : 0) + (firstStrike ? R.conflict.firstStrike : 0);
      }
      function conflictModsHer({ alertStageNow, training = 0 }) {
        return Math.max(0, alertStageNow) * R.conflict.alertStageBonus + training;
      }
      function conflictOutcome(diff) {
        const b = R.conflict.bands;
        if (diff >= b.pin) return "pin";
        if (diff >= b.scuffle) return "scuffle";
        if (diff >= b.grindLow) return "grind";
        return "overpowered";
      }
      function freezeCheck({ d20, nrv, training = 0 }) {
        let mod = 0;
        if (nrv <= 3) mod = -3;
        else if (nrv >= 6) mod = 3;
        const total = d20 + nrv + mod + training;
        const dc = R.conflict.freezeDC ?? 13;
        return { total, dc, frozen: total < dc };
      }
      function hesitationRounds(proximity) {
        if (proximity >= 70) return 2;
        if (proximity >= 40) return 1;
        return 0;
      }
      function chaseStep(diff) {
        if (diff >= R.chase.dashDiff) return 2;
        if (diff > 0) return 1;
        if (diff === 0) return 0;
        if (diff > -R.chase.dashDiff) return -1;
        return -2;
      }
      function herStamina(str) {
        return str * R.chase.herStaminaPerStr;
      }
      module.exports = {
        d20Check,
        applyAdvDis,
        pityBonus,
        heartCoeff,
        heartDelta,
        heartBaseline,
        breathGain,
        segHeartDrop,
        breathFloor,
        heartLines,
        heartCap,
        staminaSegTax,
        faceMemGain,
        faceAssociate,
        identifyCheck: faceAssociate,
        acuityCoeff,
        alertDelta,
        alertStage,
        nightStartAlert,
        warinessGain,
        conflictPower,
        conflictModsSelf,
        conflictModsHer,
        conflictOutcome,
        freezeCheck,
        hesitationRounds,
        chaseStep,
        herStamina
      };
    }
  });

  // src/runtime/dice.js
  var require_dice = __commonJS({
    "src/runtime/dice.js"(exports, module) {
      var MASK = 4294967295;
      var req = typeof __require === "function" ? __require : null;
      var nodeCrypto = req ? (() => {
        try {
          return req("crypto");
        } catch (e) {
          return null;
        }
      })() : null;
      function newSessionSalt() {
        if (nodeCrypto) return nodeCrypto.randomBytes(16).toString("hex");
        const buf = new Uint8Array(16);
        if (globalThis.crypto && globalThis.crypto.getRandomValues) globalThis.crypto.getRandomValues(buf);
        else for (let i = 0; i < 16; i++) buf[i] = Date.now() + i * 7919 & 255;
        return Array.from(buf, (x) => x.toString(16).padStart(2, "0")).join("");
      }
      function rng(seed) {
        let a = seed >>> 0;
        return function next() {
          a = a + 1831565813 & MASK;
          let t = Math.imul(a ^ a >>> 15, 1 | a);
          t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
      }
      function floorSeed(sessionSalt, floor) {
        let h = 2166136261;
        const s = String(sessionSalt) + ":" + String(floor);
        for (let i = 0; i < s.length; i++) {
          h ^= s.charCodeAt(i);
          h = Math.imul(h, 16777619) & MASK;
        }
        return h >>> 0;
      }
      function actionSeed(sessionSalt, floor, seq) {
        let h = floorSeed(sessionSalt, floor);
        h ^= seq * 2654435761 & MASK;
        h = Math.imul(h ^ h >>> 16, 2246822507) & MASK;
        return h >>> 0;
      }
      var d = (next, sides) => Math.floor(next() * sides) + 1;
      function rollD20(seed, mode = "normal") {
        const next = rng(seed);
        const a = d(next, 20), b = d(next, 20);
        if (mode === "adv") {
          const d20 = a === 20 || b === 20 ? 20 : a === 1 || b === 1 ? 1 : Math.max(a, b);
          return { d20, raw: [a, b] };
        }
        if (mode === "dis") return { d20: Math.min(a, b), raw: [a, b] };
        return { d20: a, raw: [a] };
      }
      function roll2D10(seed) {
        const next = rng(seed);
        return { dice: [d(next, 10), d(next, 10)], sum: null, get total() {
          return this.dice[0] + this.dice[1];
        } };
      }
      module.exports = { newSessionSalt, rng, floorSeed, actionSeed, rollD20, roll2D10 };
    }
  });

  // src/runtime/ledger.js
  var require_ledger = __commonJS({
    "src/runtime/ledger.js"(exports, module) {
      var C = require_checks();
      var R = require_rules();
      var LIMITS = {
        alert: [0, 100],
        wariness: [0, 100],
        heart: [0, R.heart.cap],
        stamina: [0, 999],
        cash: [0, 999999],
        pi: [0, 999],
        proximity: [0, 100],
        faceMem: [0, 20],
        pursuit: [0, 5],
        date: [1, 999999]
      };
      function createLedger(init = {}) {
        const start = {
          date: init.date ?? 1,
          alert: init.alert ?? 0,
          wariness: init.wariness ?? 0,
          heart: init.heart ?? 30,
          stamina: init.stamina ?? 100,
          cash: init.cash ?? 3e3,
          pi: init.pi ?? 0,
          proximity: init.proximity ?? 0,
          faceMem: init.faceMem ?? 0,
          pursuit: init.pursuit ?? 0
        };
        if (init.nrv != null && init.heart == null) start.heart = C.heartBaseline(init.nrv);
        let seq = 0;
        const snapshots = /* @__PURE__ */ new Map();
        const state = start;
        const clamp = (k, v) => Math.max(LIMITS[k][0], Math.min(LIMITS[k][1], v));
        return {
          state,
          /** 读账。 */
          get(k) {
            return state[k];
          },
          /**
           * 事务提交：变更集一次性落账。
           * @param {object} changes  {字段: 增量}（负数为扣减）
           * @param {object} meta     {floor, reason, extra} 回执用元信息
           * @returns {{seq, before, after, applied, clipped}} applied=实际落账增量（含边界钳制）
           */
          commit(changes, meta = {}) {
            const before = { ...state };
            const applied = {};
            for (const [k, dv] of Object.entries(changes)) {
              if (!(k in LIMITS)) throw new Error(`\u672A\u77E5\u8D26\u76EE: ${k}`);
              const nv = clamp(k, state[k] + dv);
              applied[k] = nv - state[k];
              state[k] = nv;
            }
            const seqNo = ++seq;
            snapshots.set(seqNo, { before, after: { ...state }, changes, meta, applied });
            return { seq: seqNo, before, after: { ...state }, applied, meta };
          },
          /** 快照回滚：删楼/swipe/分支切换，按 seq 整笔还原。 */
          rollback(seqNo) {
            const snap = snapshots.get(seqNo);
            if (!snap) return false;
            Object.assign(state, snap.before);
            for (const s of snapshots.keys()) if (s >= seqNo) snapshots.delete(s);
            return true;
          },
          /* ---------- 复合结算（纯函数组装，仍走 commit 单入口） ---------- */
          /** 动作结算：双账（情报收益 / 暴露代价）+ 心跳。delta 由中控用 checks 算好后传入。 */
          settleAction({ alertD = 0, heartD = 0, piD = 0, staminaD = 0, cashD = 0, proximityD = 0, faceMemD = 0 }, meta) {
            return this.commit({
              alert: alertD,
              heart: heartD,
              pi: piD,
              stamina: staminaD,
              cash: cashD,
              proximity: proximityD,
              faceMem: faceMemD
            }, meta);
          },
          /**
           * 过夜结算：警觉峰值沉淀防备、心跳回基线、体力「恢复至」分档（v0.6）、日期+1。
           * 恢复至（模拟过劳睡不好）：收摊剩余 ≥30% → 100%；10%~29% → 80%；<10% → 60%。
           */
          settleNight({ peakAlert, nrv, staminaMax = 100 }) {
            const warinessD = C.warinessGain(peakAlert);
            const ratio = state.stamina / staminaMax;
            const rest = ratio >= R.stamina.nightRest.fullMin ? 1 : ratio >= R.stamina.nightRest.midMin ? R.stamina.nightRest.midTo : R.stamina.nightRest.lowTo;
            const staminaTarget = Math.round(staminaMax * rest);
            const r = this.commit({
              wariness: warinessD,
              alert: -state.alert,
              // 当晚警觉清零
              heart: C.heartBaseline(nrv) - state.heart,
              // 回基线
              stamina: staminaTarget - state.stamina,
              // 恢复至（非恢复量）
              date: 1
            }, { reason: "settleNight" });
            return { ...r, warinessGain: warinessD, restRatio: rest, nextStartAlert: Math.round(state.wariness / 5) };
          },
          /** 追缉：只升不降（7 日冷却回落由调度层走 commit 直改，此处封快路径）。 */
          raisePursuit(level) {
            if (level <= state.pursuit) return null;
            return this.commit({ pursuit: level - state.pursuit }, { reason: "pursuit" });
          }
        };
      }
      module.exports = { createLedger, LIMITS };
    }
  });

  // src/config/lifepack.json
  var require_lifepack = __commonJS({
    "src/config/lifepack.json"(exports, module) {
      module.exports = {
        schema: "lifepack/1.0",
        note: "\u89E3\u9501\u95E8\u69DB\u8868\u4E3A\u5168\u5C40\u534F\u8BAE\uFF08\u6570\u503C\u7B56\u5212\u7B2C\u4E8C\u5341\u4E03\u8282\uFF09\uFF1B\u516D\u5927\u69FD\u4F4D\u5E73\u6ED1\u4E09\u7EA7\u9636\u68AF\uFF08L1: 15 / L2: 30 / L3: 55\uFF0C\u4E25\u683C\u9075\u5FAA L1 = floor(L2 / 2) \u516C\u5F0F\u951A\uFF09\u3002",
        unlock: {
          L1: {
            home: 15,
            schedule: 15,
            carry: 15,
            social: 15,
            psyche: 15,
            romance: 15
          },
          L2: {
            home: 30,
            schedule: 30,
            carry: 30,
            social: 30,
            psyche: 30,
            romance: 30
          },
          L3: {
            home: 55,
            schedule: 55,
            carry: 55,
            social: 55,
            psyche: 55,
            romance: 55
          }
        },
        packs: {
          student: {
            id: "student",
            name: "\u665A\u81EA\u4E60\u9AD8\u4E2D\u751F",
            stats: {
              str: 2,
              agi: 4,
              per: 4,
              nrv: 3
            },
            social: 1,
            alertMod: -5,
            traits: [
              "timid",
              "shoe_leather"
            ],
            stability: 0.85,
            defaultOutfit: {
              id: "outfit_jk_uniform",
              name: "\u5236\u5F0F\u6821\u670D",
              shoeId: "shoe_leather",
              shoeName: "\u5236\u670D\u5C0F\u76AE\u978B",
              desc: "\u85CF\u9752\u8272\u897F\u88C5\u5916\u5957\u914D\u9886\u7ED3\u4E0E\u767E\u8936\u77ED\u88D9\uFF0C\u6DF1\u7070\u53CA\u819D\u889C\uFF0C\u5916\u7F69\u7C73\u8272\u9488\u7EC7\u957F\u5F00\u886B\uFF0C\u811A\u8E29\u9ED1\u8272\u5236\u670D\u5C0F\u76AE\u978B",
              prompt: "\u901A\u8FC7\u8D34\u8EAB\u526A\u88C1\u7684\u897F\u88C5\u5236\u670D\u4E0E\u767E\u8936\u77ED\u88D9\uFF0C\u767D\u63CF\u51FA\u5C11\u5973\u9752\u6DA9\u7AEF\u6B63\u7684\u633A\u62D4\u8EAB\u59FF\u4E0E\u89C4\u77E9\u5185\u655B\u7684\u5B66\u751F\u6C14\u8D28"
            },
            weekendOutfitPool: [
              {
                id: "outfit_hoodie_denim",
                name: "\u8FDE\u5E3D\u536B\u8863+\u725B\u4ED4\u77ED\u88D9",
                shoeId: "shoe_sneakers",
                shoeName: "\u8FD0\u52A8\u978B",
                weight: 25,
                desc: "\u6D45\u7C73\u7070\u843D\u80A9\u8FDE\u5E3D\u536B\u8863\u642D\u914D\u9AD8\u8170\u6C34\u6D17\u725B\u4ED4\u77ED\u88D9\uFF0C\u7EAF\u767D\u68C9\u889C\u4E0E\u5C0F\u767D\u978B\uFF08\u8F6F\u5E95\u8FD0\u52A8\u978B\uFF09",
                prompt: "\u767D\u63CF\u536B\u8863\u62BD\u7EF3\u968F\u6B65\u6001\u8F7B\u6643\uFF0C\u77ED\u88D9\u4E0B\u53CC\u817F\u7B14\u76F4\u4FEE\u957F\uFF0C\u6D0B\u6EA2\u7740\u5E72\u51C0\u6E05\u723D\u7684\u6821\u56ED\u9752\u6625\u5143\u6C14"
              },
              {
                id: "outfit_knit_pleats",
                name: "\u8F6F\u7F8A\u6BDB\u886B+\u683C\u7EB9\u77ED\u88D9",
                shoeId: "shoe_platform",
                shoeName: "\u677E\u7CD5\u978B",
                weight: 25,
                desc: "\u5976\u767D\u8272\u84EC\u677E\u5706\u9886\u9488\u7EC7\u886B\uFF0C\u6D45\u9A7C\u8272\u82F1\u4F26\u683C\u7EB9\u77ED\u88D9\uFF0C\u6DF1\u68D5\u8272\u53CA\u819D\u8FC7\u819D\u889C\u914D\u539A\u5E95\u677E\u7CD5\u5C0F\u76AE\u978B",
                prompt: "\u767D\u63CF\u84EC\u677E\u9488\u7EC7\u886B\u52FE\u52D2\u51FA\u7684\u5355\u8584\u7EA4\u7EC6\u9AA8\u67B6\u4E0E\u53CA\u819D\u889C\u4FEE\u9970\u51FA\u7684\u5300\u79F0\u5C0F\u817F\uFF0C\u5C3D\u663E\u6587\u9759\u6E29\u67D4\u7684\u5B66\u751F\u4E66\u5377\u6C14\u8D28"
              },
              {
                id: "outfit_cardigan_onepiece",
                name: "\u9488\u7EC7\u77ED\u5F00\u886B+\u788E\u82B1\u540A\u5E26\u88D9",
                shoeId: "shoe_flats",
                shoeName: "\u5E73\u5E95\u978B",
                weight: 25,
                desc: "\u6D45\u7C89\u7070\u7EC6\u788E\u82B1\u540A\u5E26\u9AD8\u8170\u68C9\u88D9\uFF0C\u5916\u7F69\u8584\u71D5\u9EA6\u8272\u9488\u7EC7\u77ED\u5F00\u886B\uFF0C\u5E73\u5E95\u739B\u4E3D\u73CD\u978B",
                prompt: "\u767D\u63CF\u8F7B\u67D4\u6CE2\u6298\u7684\u88D9\u6446\u4E0E\u8D34\u5408\u8EAB\u5F62\u7684\u8170\u7EBF\uFF0C\u5C55\u73B0\u51FA\u96BE\u5F97\u8131\u79BB\u6821\u670D\u62D8\u8C28\u7684\u5C11\u5973\u9752\u6DA9\u8EAB\u59FF"
              },
              {
                id: "outfit_jacket_shorts",
                name: "\u62FC\u8272\u68D2\u7403\u670D+\u8FD0\u52A8\u77ED\u88E4",
                shoeId: "shoe_sneakers",
                shoeName: "\u8FD0\u52A8\u978B",
                weight: 25,
                desc: "\u77ED\u6B3E\u65E5\u7CFB\u68D2\u7403\u5939\u514B\u5185\u642D\u7EAF\u767D\u4FEE\u8EABT\u6064\uFF0C\u6EDA\u8FB9\u8FD0\u52A8\u77ED\u88E4\uFF0C\u6761\u7EB9\u8FD0\u52A8\u957F\u889C\u4E0E\u8F7B\u4FBF\u8DD1\u978B\uFF08\u8FD0\u52A8\u978B\uFF09",
                prompt: "\u767D\u63CF\u77ED\u5939\u514B\u4E0B\u8F7B\u76C8\u6D3B\u529B\u7684\u6B65\u6001\u4E0E\u5065\u7F8E\u5300\u79F0\u7684\u53CC\u817F\u7EBF\u6761\uFF0C\u5C55\u73B0\u51FA\u5927\u6B65\u5FEB\u8D70\u7684\u671D\u6C14\u4E0E\u8EAB\u5F62\u8212\u5C55"
              }
            ],
            somaticPool: [
              {
                id: "normal",
                name: "\u5E73\u5E38\u72B6\u6001",
                weight: 40,
                mod: {},
                desc: "\u57FA\u7EBF\u5E73\u6DE1\u653E\u5B66\uFF0C\u6B65\u5C65\u89C4\u5F8B",
                reasons: [
                  "\u65E5\u5E38\u5E73\u7A33\u653E\u5B66\uFF0C\u6B65\u5C65\u89C4\u5F8B\u5E73\u7A33\uFF0C\u5FC3\u5883\u5E73\u9759",
                  "\u666E\u901A\u7684\u665A\u5F52\u65E5\u5E38\uFF0C\u80CC\u810A\u7AEF\u6B63\uFF0C\u5B89\u9759\u524D\u884C",
                  "\u6CA1\u6709\u7279\u522B\u9AD8\u5174\u6216\u70E6\u607C\u7684\u4E8B\u60C5\uFF0C\u6309\u7167\u4E60\u60EF\u8282\u594F\u8D70\u5728\u8001\u8857\u8DEF\u4E0A"
                ],
                prompt: "\u767D\u63CF\u5176\u80CC\u810A\u7AEF\u6B63\u3001\u6B65\u4F10\u5300\u79F0\u5E73\u7A33\u7684\u4F18\u7B49\u751F\u5E38\u6001"
              },
              {
                id: "fatigued",
                name: "\u8EAB\u5FC3\u75B2\u60EB",
                weight: 25,
                mod: {
                  agi: -1
                },
                desc: "\u8EAB\u5FC3\u8017\u795E\uFF0C\u53CC\u817F\u9178\u6C89\uFF0C\u654F\u6377 -1",
                reasons: [
                  "\u6A21\u62DF\u8003\u8FDE\u8003\u4E09\u95E8\u6587\u7EFC\uFF0C\u8111\u5B50\u53D1\u6728\u53D1\u80C0\uFF0C\u6B65\u5C65\u62D6\u6C93\u6C89\u91CD",
                  "\u4E0B\u5348\u521A\u6D4B\u5B8C\u5973\u5B50800\u7C73\u957F\u8DD1\u6D4B\u8BD5\uFF0C\u53CC\u817F\u9178\u6C89\u53D1\u8F6F\uFF0C\u8FC8\u6B65\u8FDF\u7F13",
                  "\u653E\u5B66\u88AB\u8001\u5E08\u7559\u5802\u91CD\u8BA2\u6B63\u9519\u9898\uFF0C\u4F4E\u5934\u53F9\u6C14\uFF0C\u5FC3\u60C5\u4F4E\u843D\u56F0\u5026"
                ],
                prompt: "\u767D\u63CF\u5176\u653E\u5B66\u540E\u7684\u75B2\u4E4F\u62D6\u6C93\uFF0C\u80A9\u8180\u88AB\u4E66\u5305\u538B\u6C89\u5FAE\u53F9\u6C14"
              },
              {
                id: "relaxed",
                name: "\u8F7B\u677E\u8212\u7545",
                weight: 20,
                mod: {
                  per: -1
                },
                desc: "\u5FC3\u5883\u677E\u5F1B\uFF0C\u6709\u6548\u654F\u9510 -1",
                reasons: [
                  "\u4ECA\u5929\u5439\u594F\u90E8\u5408\u7EC3\u88AB\u5B66\u59D0\u8868\u626C\uFF0C\u5FC3\u60C5\u6781\u4F73\uFF0C\u6B65\u4F10\u8F7B\u76C8\u98D8\u98D8\u7136",
                  "\u653E\u5B66\u987A\u8DEF\u4E70\u5230\u4E86\u521A\u51FA\u7089\u7684\u8349\u8393\u5927\u798F\u751C\u54C1\uFF0C\u6EE1\u8138\u6EE1\u8DB3\u751C\u610F",
                  "\u82F1\u8BED\u968F\u5802\u5C0F\u6D4B\u62FF\u4E86\u6EE1\u5206\uFF0C\u6B65\u5C65\u8F7B\u76C8\u8DF3\u8DC3\uFF0C\u8F7B\u58F0\u54FC\u7740\u6B22\u5FEB\u5C0F\u8C03",
                  "\u5728\u8D70\u5ECA\u521A\u597D\u548C\u9694\u58C1\u73ED\u6697\u604B\u7684\u5B66\u957F\u5BF9\u89C6\u5E76\u70B9\u5934\u62DB\u547C\uFF0C\u5FC3\u4E0D\u5728\u7109\u5730\u5077\u7B11"
                ],
                prompt: "\u767D\u63CF\u5176\u6B65\u6001\u8F7B\u76C8\u8F7B\u5FEB\u3001\u968F\u6B65\u9891\u5FAE\u6643\u4E66\u5305\u5C0F\u6302\u4EF6\u7684\u9752\u6625\u4F53\u6001"
              },
              {
                id: "rushing",
                name: "\u7D27\u7EF7\u8D76\u8DEF",
                weight: 15,
                mod: {
                  agi: 1
                },
                desc: "\u903C\u8FD1\u5BB6\u89C4\u95E8\u7981\uFF0C\u5C0F\u6B65\u524D\u503E\u75BE\u884C\uFF0C\u654F\u6377 +1",
                reasons: [
                  "\u8DDD\u79BB\u4E25\u683C\u5BB6\u89C4\u95E8\u7981\u4EC5\u526915\u5206\u949F\uFF0C\u751F\u6015\u88AB\u7F5A\u6CA1\u6536\u624B\u673A\uFF0C\u6025\u4FC3\u524D\u503E\u62A2\u6B65",
                  "\u591C\u7A7A\u95F7\u96F7\u6EDA\u6EDA\u672A\u5E26\u96E8\u4F1E\uFF0C\u751F\u6015\u5927\u96E8\u503E\u76C6\uFF0C\u5C0F\u6B65\u75BE\u884C\u8D76\u8DEF"
                ],
                prompt: "\u767D\u63CF\u5176\u8EAB\u4F53\u5FAE\u524D\u503E\u5FEB\u6B65\u75BE\u8D70\u3001\u9891\u9891\u4F4E\u5934\u786E\u8BA4\u7535\u5B50\u8868\u7684\u795E\u6001"
              }
            ],
            handPool: {
              siteOverrides: {
                school_bus_terminal_b: {
                  id: "ticket_fumble",
                  name: "\u7FFB\u627E\u6708\u7968",
                  fumbling: true,
                  desc: "\u5728\u516C\u4EA4\u7AD9\u524D\u505C\u6B65\u7FFB\u5305\u627E\u5B66\u751FIC\u5361"
                },
                store_24h_b: {
                  id: "drink_buy",
                  name: "\u4E70\u70ED\u996E",
                  fumbling: false,
                  desc: "\u5728\u4FBF\u5229\u5E97\u81EA\u52A8\u8D29\u5356\u673A\u524D\u4E70\u70ED\u996E"
                },
                unit_stairs_b: {
                  id: "key_fumble",
                  name: "\u638F\u94A5\u5319",
                  fumbling: true,
                  desc: "\u5728\u660F\u6697\u5355\u5143\u95E8\u524D\u6478\u7D22\u9632\u76D7\u95E8\u94A5\u5319\u4E32"
                },
                old_metro_b: {
                  id: "metro_fumble",
                  name: "\u7FFB\u627E\u8F66\u7968",
                  fumbling: true,
                  desc: "\u5728\u8001\u8857\u5730\u94C1\u51FA\u7AD9\u95F8\u673A\u524D\u505C\u6B65\uFF0C\u4F4E\u5934\u7FFB\u5305\u5BFB\u627E\u5B66\u751F\u5355\u7A0B\u7968\u6216\u4EA4\u901A\u5361"
                },
                school_gate_b: {
                  id: "bag_tidy",
                  name: "\u6574\u7406\u4E66\u5305",
                  fumbling: true,
                  desc: "\u8D70\u51FA\u6821\u95E8\u540E\u5728\u660F\u6697\u95E8\u67F1\u65C1\u505C\u6B65\uFF0C\u62C9\u4E25\u6C89\u91CD\u4E66\u5305\u7684\u62C9\u94FE\u5E76\u7CFB\u7D27\u56F4\u5DFE"
                }
              },
              carriagePool: [
                {
                  id: "carriage_normal",
                  name: "\u6276\u624B\u4E58\u8F66",
                  weight: 45,
                  duration: 1,
                  tag: null,
                  desc: "\u5355\u624B\u62C9\u7740\u8F66\u53A2\u540A\u73AF\u6216\u9760\u6276\u624B\u7AD9\u7ACB\uFF0C\u671B\u5411\u6F06\u9ED1\u8F66\u7A97\u53D1\u5446\uFF0C\u53CC\u624B\u5904\u4E8E\u7A7A\u95F2\u6001"
                },
                {
                  id: "carriage_phone",
                  name: "\u624B\u673A\u4E0E\u8033\u673A",
                  weight: 35,
                  duration: 1,
                  tag: "hand_phone",
                  desc: "\u6234\u7740\u8033\u673A\u53CC\u624B\u6367\u624B\u673A\u4F4E\u5934\u6D4F\u89C8\u5C4F\u5E55\uFF0C\u5916\u754C\u58F0\u54CD\u4E0E\u89C6\u7EBF\u5B8C\u5168\u88AB\u9694\u7EDD\uFF0C\u8DDF\u7F00\u9690\u853D +2"
                },
                {
                  id: "carriage_doze",
                  name: "\u6447\u6643\u778C\u7761",
                  weight: 20,
                  duration: 1,
                  tag: "hand_fumble",
                  desc: "\u501A\u7740\u8F66\u53A2\u5EA7\u6905\u968F\u7740\u5217\u8F66\u6643\u8361\u8F7B\u8F7B\u5782\u5934\u6253\u778C\u7761\uFF0C\u53CC\u624B\u65E0\u529B\u642D\u5728\u4E66\u5305\u4E0A\uFF0C\u611F\u77E5\u4E0E\u8B66\u60D5\u964D\u81F3\u4F4E\u70B9"
                }
              ],
              enRoute: [
                {
                  id: "normal",
                  name: "\u6B63\u5E38\u6446\u81C2",
                  weight: 40,
                  duration: 2,
                  tag: null,
                  desc: "\u7A7A\u624B\u81EA\u7136\u6446\u81C2\uFF0C\u53CC\u624B\u5904\u4E8E\u5B8C\u5168\u7A7A\u95F2\u6001"
                },
                {
                  id: "phone_browse",
                  name: "\u800D\u624B\u673A",
                  weight: 20,
                  duration: 2,
                  tag: "hand_phone",
                  desc: "\u4F4E\u5934\u770B\u5C4F\u5E55\u5927\u62C7\u6307\u6ED1\u52A8\uFF0C\u73A9\u5BB6\u8DDF\u7F00\u9690\u853D +2"
                },
                {
                  id: "hands_pocket",
                  name: "\u4FDD\u6696\u63D2\u515C",
                  weight: 8,
                  duration: 2,
                  tag: "hand_pocket",
                  desc: "\u53CC\u624B\u7F29\u5728\u9488\u7EC7\u5F00\u886B\u8896\u53E3\u91CC\u53D6\u6696\uFF0C\u9047\u88AD\u53CD\u6297 -2"
                },
                {
                  id: "phone_call",
                  name: "\u63A5\u7535\u8BDD",
                  weight: 8,
                  duration: 1,
                  tag: "hand_call",
                  desc: "\u5355\u624B\u8D34\u8033\u5E94\u7B54\u5BB6\u4EBA\uFF0C\u73A9\u5BB6\u9690\u853D +1\uFF0C\u53CD\u6297 -1"
                },
                {
                  id: "book_read",
                  name: "\u770B\u4E66\u9ED8\u80CC",
                  weight: 8,
                  duration: 1,
                  tag: "hand_book",
                  desc: "\u53CC\u624B\u6367\u5DF4\u638C\u5927\u8BCD\u6C47\u624B\u518C\u9ED8\u80CC\uFF0C\u73A9\u5BB6\u9690\u853D +2"
                },
                {
                  id: "drink_sip",
                  name: "\u559D\u996E\u54C1",
                  weight: 8,
                  duration: 1,
                  tag: "hand_drink",
                  desc: "\u5355\u624B\u6367\u7EB8\u76D2\u5976\u8336\u54AC\u5438\u7BA1\uFF0C\u73A9\u5BB6\u9690\u853D +1\uFF0C\u53CD\u6297 -1"
                },
                {
                  id: "food_eat",
                  name: "\u5403\u4E1C\u897F",
                  weight: 8,
                  duration: 1,
                  tag: "hand_eat",
                  desc: "\u5355\u624B\u62FF\u9632\u6CB9\u7EB8\u888B\u5C0F\u5403\u5480\u56BC\uFF0C\u73A9\u5BB6\u9690\u853D +1\uFF0C\u53CD\u6297 -1"
                }
              ]
            },
            flavor: {
              face: "\u5BB3\u6015\u5730\u54AC\u7D27\u4E0B\u5507\uFF0C\u501F\u52A9\u8857\u8FB9\u81EA\u884C\u8F66\u53CD\u5149\u955C\u7684\u5012\u5F71\u5077\u77A5\u4E00\u773C\u8EAB\u540E",
              evade: "\u53CC\u624B\u6293\u7D27\u4E66\u5305\u5E26\uFF0C\u8E29\u7740\u5C0F\u76AE\u978B\u5728\u8DEF\u706F\u9634\u5F71\u8FB9\u7F18\u4ED3\u7687\u5C0F\u8DD1",
              shield: "\u4F4E\u7740\u5934\u5C0F\u6B65\u75BE\u8D70\uFF0C\u4E00\u5934\u94BB\u8FDB\u4FBF\u5229\u5E97\u660E\u4EAE\u7684\u767D\u70BD\u706F\u5149\u4E0B\u5047\u88C5\u770B\u6587\u5177",
              signal: "\u98A4\u6296\u7740\u4ECE\u6821\u670D\u53E3\u888B\u638F\u51FA\u624B\u673A\uFF0C\u6309\u4EAE\u5C4F\u5E55\u5047\u88C5\u7ED9\u5BB6\u4EBA\u6253\u7535\u8BDD"
            },
            routes: [
              {
                id: "workday_evening",
                days: [
                  1,
                  2,
                  3,
                  4,
                  5
                ],
                note: "\u5468\u5185\u665A\u81EA\u4E60\u5E38\u89C4\u653E\u5B66\u8DEF\u7EBF\uFF08\u524D\u534A\u6BB5\u7ED3\u4F34\uFF0C\u540E\u534A\u6BB5\u72EC\u884C\uFF09",
                prompt: "\u767D\u63CF\u665A\u81EA\u4E60\u653E\u5B66\u540E\u7684\u6821\u95E8\u4EBA\u6F6E\u4E0E\u6DF1\u5DF7\u66AE\u8272\uFF0C\u524D\u534A\u7A0B\u4E0E\u540C\u4F34\u7ED3\u4F34\u4F4E\u8BED\uFF0C\u5728\u5B66\u533A\u516C\u4EA4\u7AD9\u544A\u522B\u540E\u72EC\u81EA\u62D0\u5165\u8001\u5DF7",
                path: [
                  {
                    place: "school_gate_b",
                    t: "2100"
                  },
                  {
                    place: "school_bus_terminal_b",
                    t: "2115"
                  },
                  {
                    place: "store_24h_b",
                    t: "2130"
                  },
                  {
                    place: "old_alley_main_b",
                    t: "2145"
                  },
                  {
                    place: "unit_stairs_b",
                    t: "2200"
                  }
                ]
              },
              {
                id: "friday_late",
                days: [
                  5
                ],
                note: "\u5468\u4E94\u5355\u4EBA\u503C\u65E5\u665A\u5F52\u8DEF\u7EBF\uFF08\u5168\u7EBF\u65E0\u7ED3\u4F34\u63A9\u62A4\uFF09",
                prompt: "\u767D\u63CF\u5468\u4E94\u5355\u4EBA\u503C\u65E5\u5173\u95E8\u540E\u7684\u5BC2\u9759\u591C\u8272\uFF0C\u624B\u63D0\u6C89\u91CD\u4E66\u5305\u4F4E\u5934\u5FEB\u6B65\u72EC\u884C\uFF0C\u6574\u6761\u5F52\u9014\u65E0\u540C\u4F34\u63A9\u62A4",
                path: [
                  {
                    place: "school_gate_b",
                    t: "2130"
                  },
                  {
                    place: "old_alley_main_b",
                    t: "2145"
                  },
                  {
                    place: "dark_blind_alley_b",
                    t: "2200"
                  },
                  {
                    place: "unit_stairs_b",
                    t: "2215"
                  }
                ]
              },
              {
                id: "saturday_cram",
                days: [
                  6
                ],
                note: "\u5468\u516D\u5B66\u4E60\u587E\u8865\u4E60\u653E\u5B66\u8DEF\u7EBF\uFF08\u6587\u5177\u5E97\u4E8C\u697C\u4E0B\u8BFE\u5F52\u5BB6\uFF0C\u72EC\u884C\uFF09",
                prompt: "\u767D\u63CF\u8865\u4E60\u653E\u5B66\u540E\u62B1\u7740\u8BD5\u5377\u8D44\u6599\u7684\u75B2\u5026\u4E0E\u5B89\u9759\uFF0C\u7A7F\u642D\u8F7B\u4FBF\uFF0C\u5728\u9EC4\u660F\u66AE\u8272\u4E2D\u72EC\u884C\u7A7F\u8FC7\u8001\u5DF7",
                path: [
                  {
                    place: "store_24h_b",
                    t: "1830"
                  },
                  {
                    place: "old_alley_main_b",
                    t: "1850"
                  },
                  {
                    place: "school_bus_terminal_b",
                    t: "1905"
                  },
                  {
                    place: "unit_stairs_b",
                    t: "1920"
                  }
                ]
              },
              {
                id: "saturday_outing",
                days: [
                  6
                ],
                note: "\u5468\u516D\u5546\u5708\u51FA\u6E38\u5F52\u6765\u8DEF\u7EBF\uFF08\u5730\u94C1\u7AD9\u6563\u5FC3\u5F52\u6765\uFF0C\u624B\u6367\u5C0F\u5403\u996E\u54C1\uFF09",
                prompt: "\u767D\u63CF\u5C11\u5973\u96BE\u5F97\u5468\u672B\u5916\u51FA\u6E38\u73A9\u7684\u8F7B\u677E\u4E0E\u6D3B\u529B\uFF0C\u8FB9\u8D70\u8FB9\u542E\u5438\u5976\u8336\u6216\u4F4E\u5934\u770B\u624B\u673A\uFF0C\u6B65\u5C65\u8212\u7F13\u8F7B\u5FEB",
                path: [
                  {
                    place: "old_metro_b",
                    t: "2030"
                  },
                  {
                    place: "old_park_b",
                    t: "2050"
                  },
                  {
                    place: "store_24h_b",
                    t: "2110"
                  },
                  {
                    place: "unit_stairs_b",
                    t: "2130"
                  }
                ]
              },
              {
                id: "saturday_date_home",
                days: [
                  6
                ],
                note: "\u5468\u516D\u9752\u6DA9\u7EA6\u4F1A\xB7\u9001\u522B\u56DE\u5BB6\u8DEF\u7EBF\uFF08\u4F9D\u4F9D\u4E0D\u820D\u544A\u522B\u7537\u751F\u540E\u72EC\u81EA\u8D76\u95E8\u7981\uFF09",
                prompt: "\u767D\u63CF\u9752\u6DA9\u60C5\u4FA3\u95F4\u79BB\u522B\u65F6\u7684\u4F9D\u604B\u4E0E\u7F9E\u6DA9\uFF0C\u5341\u6307\u76F8\u6263\u53C8\u677E\u5F00\u7684\u5C40\u4FC3\u544A\u522B\uFF0C\u968F\u540E\u5C11\u5973\u4F4E\u5934\u786E\u8BA4\u65F6\u95F4\u5C0F\u6B65\u5FEB\u8D70\u62A2\u95E8\u7981",
                path: [
                  {
                    place: "old_metro_b",
                    t: "2140"
                  },
                  {
                    place: "old_park_b",
                    t: "2155"
                  },
                  {
                    place: "old_alley_main_b",
                    t: "2205"
                  },
                  {
                    place: "unit_stairs_b",
                    t: "2215"
                  }
                ]
              },
              {
                id: "saturday_date_hotel",
                days: [
                  6
                ],
                note: "\u5468\u516D\u9752\u6DA9\u7EA6\u4F1A\xB7\u60C5\u4FA3\u65C5\u793E\u7279\u6B8A\u8D70\u5411\uFF08\u60C5\u4FA3\u76F8\u4F34\u8FC8\u5165\u60C5\u4FA3\u65C5\u793E\uFF09",
                prompt: "\u767D\u63CF\u9752\u6DA9\u60C5\u4FA3\u521D\u6B21\u7275\u624B\u7684\u5C40\u4FC3\u4E0E\u5A07\u7F9E\uFF0C\u7EAF\u771F\u604B\u7231\u7684\u5FAE\u751C\u4E0E\u6069\u7231\u3002\u4E24\u4EBA\u5341\u6307\u7D27\u6263\uFF0C\u5E76\u80A9\u62D0\u5165\u4E00\u6761\u964C\u751F\u72ED\u7A84\u7684\u504F\u50FB\u4FA7\u5DF7\u6DF1\u5904\uFF1B\u5C11\u5973\u5FC3\u8DF3\u5FAE\u5FEB\u3001\u638C\u5FC3\u6CDB\u8D77\u7EC6\u6C57\uFF0C\u5E26\u7740\u5BF9\u8DE8\u5165\u5927\u4EBA\u4E16\u754C\u7684\u5411\u5F80\u4E0E\u7D27\u5F20\u3002\u4E25\u7981\u63D0\u524D\u5267\u900F\u76EE\u7684\u5730\u5177\u4F53\u540D\u79F0\u3002",
                path: [
                  {
                    place: "old_metro_b",
                    t: "2140"
                  },
                  {
                    place: "old_park_b",
                    t: "2155"
                  },
                  {
                    place: "old_alley_main_b",
                    t: "2210"
                  },
                  {
                    place: "love_hotel_b",
                    t: "2220"
                  }
                ]
              },
              {
                id: "sunday_rest",
                days: [
                  7
                ],
                note: "\u5468\u65E5\u5168\u5929\u5C45\u5BB6\u4F11\u6574\uFF08\u4E0D\u51FA\u95E8\uFF09",
                prompt: "\u767D\u63CF\u5C11\u5973\u5468\u65E5\u5168\u5929\u5728\u5BD3\u6240\u5185\u5B89\u9759\u4F11\u6574\uFF0C\u7A97\u5E18\u62C9\u8D77\uFF0C\u672A\u66FE\u5916\u51FA\uFF0C\u8857\u9053\u4E0A\u65E0\u5176\u8DB3\u8FF9",
                path: [
                  {
                    place: "unit_stairs_b",
                    t: "2000"
                  }
                ]
              }
            ],
            conditions: [
              {
                id: "companion",
                title: "\u540C\u684C\u540C\u884C",
                mod: 1
              },
              {
                id: "curfew_tight",
                title: "\u95E8\u7981\u7D27\u8FEB",
                mod: 1
              },
              {
                id: "solo_duty",
                title: "\u72EC\u81EA\u503C\u65E5",
                mod: 2
              }
            ],
            factPool: [
              {
                id: "student_home_area",
                slot: "home",
                level: 1,
                public: false,
                title: "\u5C45\u4F4F\u7247\u533A",
                text: "\u4F4F\u5728\u8001\u57CE\u6587\u6559\u533A\u8179\u5730\uFF0C\u4ECE\u5B66\u6821\u6B65\u884C\u4E8C\u5341\u5206\u949F\u4EE5\u5185\u5373\u53EF\u5230\u8FBE\u3002",
                place: null,
                reveal_via: []
              },
              {
                id: "student_home_block",
                slot: "home",
                level: 2,
                public: false,
                title: "\u4F4F\u5904\u73AF\u5883",
                text: "\u5BB6\u5728\u4E00\u7247\u8001\u65E7\u7684\u72EC\u680B\u516C\u5BD3\u533A\uFF0C\u6CBF\u8857\u7A84\u5DF7\u6CA1\u6709\u8DEF\u706F\uFF0C\u56F4\u5899\u4E0A\u722C\u7740\u67AF\u85E4\u3002",
                place: "unit_stairs_b",
                reveal_via: []
              },
              {
                id: "student_home_number",
                slot: "home",
                level: 3,
                public: false,
                title: "\u95E8\u724C",
                text: "\u95E8\u724C301\uFF0C\u95E8\u628A\u624B\u4E0A\u6302\u7740\u53EF\u7231\u7684\u5361\u901A\u5E03\u5957\uFF0C\u4FE1\u7BB1\u91CC\u585E\u7740\u5347\u5B66\u8865\u4E60\u587E\u7684\u5BA3\u4F20\u518C\u3002",
                place: "unit_stairs_b",
                reveal_via: [
                  "locate",
                  "check_mailbox"
                ]
              },
              {
                id: "student_sched_release",
                slot: "schedule",
                level: 1,
                public: false,
                title: "\u653E\u5B66\u65F6\u95F4",
                text: "\u5E73\u65E5\u665A\u81EA\u4E6021:00\u51C6\u65F6\u6253\u94C3\u4E0B\u8BFE\uFF0C\u5468\u4E94\u503C\u65E5\u4F1A\u665A\u8D70\u7EA6\u534A\u5C0F\u65F6\u3002",
                place: "school_gate_b",
                reveal_via: []
              },
              {
                id: "student_sched_terminal",
                slot: "schedule",
                level: 2,
                public: false,
                title: "\u6563\u4F19\u8282\u70B9",
                text: "\u6BCF\u665A\u90FD\u4F1A\u4E0E\u540C\u684C\u7ED3\u4F34\u8D70\u5230\u5B66\u533A\u516C\u4EA4\u603B\u7AD9\uFF0C\u76F4\u5230\u540C\u4F34\u4E0A\u8F66\u540E\u624D\u72EC\u81EA\u6B65\u884C\u6298\u8FD4\u5165\u5DF7\u3002",
                place: "school_bus_terminal_b",
                reveal_via: [
                  "follow",
                  "stakeout"
                ]
              },
              {
                id: "student_sched_weekend",
                slot: "schedule",
                level: 3,
                public: false,
                title: "\u5468\u672B\u8BFE\u8868",
                text: "\u5468\u516D\u4E0B\u5348\u5728\u6587\u5177\u5E97\u4E8C\u697C\u7684\u5B66\u4E60\u587E\u8865\u4E60\u82F1\u6587\uFF0C\u508D\u665A\u72EC\u884C\u5F52\u5BB6\u3002",
                place: "store_24h_b",
                reveal_via: [
                  "locate",
                  "ransack"
                ]
              },
              {
                id: "student_carry_bag",
                slot: "carry",
                level: 1,
                public: false,
                title: "\u5B66\u751F\u63D0\u5305",
                text: "\u6DF1\u8272\u5236\u5F0F\u5B66\u751F\u76AE\u5305\uFF0C\u62C9\u94FE\u4E0A\u6302\u7740\u78E8\u635F\u6389\u6F06\u7684\u52A8\u6F2B\u4E9A\u514B\u529B\u94A5\u5319\u6263\u3002",
                place: null,
                reveal_via: [
                  "photo",
                  "scan"
                ]
              },
              {
                id: "student_carry_bottle",
                slot: "carry",
                level: 2,
                public: false,
                title: "\u4FA7\u888B\u996E\u54C1",
                text: "\u4E66\u5305\u4FA7\u888B\u7ECF\u5E38\u63D2\u7740\u4E00\u76D2\u559D\u4E86\u4E00\u534A\u7684\u7EB8\u76D2\u8349\u8393\u725B\u5976\uFF0C\u6216\u8005\u6D45\u84DD\u8272\u7684\u4FDD\u6E29\u6C34\u676F\u3002",
                place: null,
                reveal_via: [
                  "scan",
                  "photo"
                ]
              },
              {
                id: "student_carry_handbook",
                slot: "carry",
                level: 3,
                public: false,
                title: "\u968F\u8EAB\u79C1\u5BC6\u624B\u8D26",
                text: "\u5305\u5E95\u6697\u683C\u85CF\u7740\u4E00\u672C\u7528\u8D34\u7EB8\u5C01\u597D\u7684\u79C1\u5BC6\u624B\u8D26\uFF0C\u5939\u5C42\u5199\u7740\u6697\u604B\u9694\u58C1\u73ED\u7537\u751F\u7684\u5B66\u53F7\u4E0E\u5FC3\u4E8B\u3002",
                place: null,
                reveal_via: [
                  "ransack",
                  "pick"
                ]
              },
              {
                id: "student_social_peer",
                slot: "social",
                level: 1,
                public: false,
                title: "\u793E\u4EA4\u5708",
                text: "\u793E\u4EA4\u8F83\u7A84\uFF0C\u5168\u6821\u53EA\u548C\u540C\u684C\u5973\u751F\u4EB2\u5BC6\u65E0\u95F4\uFF0C\u9762\u5BF9\u5F02\u6027\u642D\u8BDD\u683C\u5916\u62D8\u8C28\u3002",
                place: null,
                reveal_via: [
                  "hear_gossip",
                  "chat"
                ]
              },
              {
                id: "student_social_parents",
                slot: "social",
                level: 2,
                public: false,
                title: "\u4E25\u82DB\u5BB6\u6559",
                text: "\u7236\u6BCD\u7BA1\u6559\u4E25\u5389\uFF0C\u8BBE\u7ACB\u4E8622:15\u4E25\u683C\u95E8\u7981\uFF0C\u665A\u5F52\u4F1A\u88AB\u76D8\u95EE\u5E76\u6CA1\u6536\u624B\u673A\u3002",
                place: null,
                reveal_via: [
                  "listen",
                  "hear_gossip"
                ]
              },
              {
                id: "student_social_crush",
                slot: "social",
                level: 3,
                public: false,
                title: "\u5355\u604B\u5FC3\u4E8B",
                text: "\u6697\u604B\u9694\u58C1\u73ED\u7684\u5347\u5B66\u699C\u7B2C\u4E00\u540D\uFF0C\u4F46\u81EA\u5C0A\u5FC3\u8981\u5F3A\u4ECE\u4E0D\u6562\u642D\u8BDD\uFF0C\u6BCF\u5929\u653E\u5B66\u4F1A\u6545\u610F\u4ECE\u90A3\u95F4\u6559\u5BA4\u95E8\u524D\u8D70\u8FC7\u3002",
                place: "school_gate_b",
                reveal_via: [
                  "ransack",
                  "audit_class"
                ]
              },
              {
                id: "student_psyche_dark",
                slot: "psyche",
                level: 1,
                public: false,
                title: "\u60E7\u9ED1\u5FC3\u7406",
                text: "\u751F\u6027\u80C6\u602F\u6015\u9ED1\uFF0C\u7A7F\u8FC7\u65E0\u706F\u5C0F\u5DF7\u65F6\u4F1A\u4E0B\u610F\u8BC6\u8D34\u7740\u5899\u8FB9\u5C0F\u8DD1\uFF0C\u5047\u88C5\u770B\u624B\u673A\u5C4F\u5E55\u58EE\u80C6\u3002",
                place: "old_alley_main_b",
                reveal_via: [
                  "timing",
                  "scan"
                ]
              },
              {
                id: "student_psyche_stubborn",
                slot: "psyche",
                level: 2,
                public: false,
                title: "\u8981\u5F3A\u5916\u58F3",
                text: "\u81EA\u5C0A\u5FC3\u8981\u5F3A\uFF0C\u9047\u5230\u964C\u751F\u4EBA\u642D\u8BDD\u6216\u7D27\u903C\u65F6\uFF0C\u4F1A\u6B7B\u6B7B\u54AC\u4F4F\u5634\u5507\u786C\u6491\u5FEB\u8D70\uFF0C\u7EDD\u4E0D\u4E3B\u52A8\u6C42\u9976\u3002",
                place: null,
                reveal_via: [
                  "greet",
                  "chat"
                ]
              },
              {
                id: "student_psyche_scandal",
                slot: "psyche",
                level: 3,
                public: false,
                title: "\u540D\u8A89\u6B7B\u7A74",
                text: "\u8A93\u6B7B\u634D\u536B\u4F18\u7B49\u751F\u58F0\u8A89\uFF0C\u683C\u5916\u754F\u60E7\u88AB\u5B66\u6821\u901A\u62A5\u3001\u53EB\u5BB6\u957F\u6216\u88AB\u5468\u56F4\u4EBA\u6307\u6307\u70B9\u70B9\u2014\u2014\u8FD9\u662F\u80FD\u51FB\u7A7F\u5979\u5FC3\u7406\u9632\u7EBF\u7684\u5173\u952E\u8981\u5BB3\u3002",
                place: null,
                reveal_via: [
                  "audit_class",
                  "chat"
                ]
              },
              {
                id: "student_romance_status",
                slot: "romance",
                level: 1,
                public: false,
                title: "\u604B\u7231\u72B6\u6001",
                text: "\u5904\u4E8E\u60C5\u7AA6\u521D\u5F00\u7684\u5355\u604B\u9636\u6BB5\uFF0C\u6CA1\u6709\u6B63\u5F0F\u4EA4\u5F80\u7684\u7537\u670B\u53CB\uFF0C\u9762\u5BF9\u5F02\u6027\u76EE\u5149\u4F1A\u7F9E\u602F\u907F\u5F00\u3002",
                place: null,
                reveal_via: []
              },
              {
                id: "student_romance_boundary",
                slot: "romance",
                level: 2,
                public: false,
                title: "\u7EAF\u60C5\u754C\u9650",
                text: "\u653E\u5B66\u5076\u5C14\u4E0E\u6697\u604B\u7684\u540C\u7EA7\u7537\u751F\u7ED3\u4F34\u8D70\u4E00\u5C0F\u6BB5\u8DEF\uFF0C\u8FDE\u8863\u8896\u76F8\u78B0\u90FD\u4F1A\u8033\u6839\u6CDB\u7EA2\uFF0C\u672A\u6709\u8FC7\u4EFB\u4F55\u903E\u77E9\u4EB2\u5BC6\u63A5\u89E6\u3002",
                place: null,
                reveal_via: [
                  "hear_gossip",
                  "chat",
                  "watch_peers"
                ]
              },
              {
                id: "student_romance_virgin",
                slot: "romance",
                level: 3,
                public: false,
                title: "\u7EAF\u6D01\u4E4B\u8EAF",
                text: "\u59CB\u7EC8\u4FDD\u6709\u5B8C\u6574\u7684\u6E05\u767D\u5904\u5B50\u4E4B\u8EAB\uFF0C\u5BF9\u7537\u5973\u60C5\u4E8B\u61F5\u61C2\u751F\u6DA9\uFF0C\u8EAB\u4F53\u7EAF\u6D01\u65E0\u6687\u3002",
                place: null,
                reveal_via: [
                  "hear_gossip",
                  "pump_person",
                  "audit_class"
                ]
              }
            ],
            romancePool: [
              {
                id: "virgin_in_love",
                name: "\u6709\u604B\u4EBA \u672A\u53D1\u751F\u5173\u7CFB \u5904\u5973",
                facts: [
                  {
                    id: "target_romance_virgin_status",
                    slot: "romance",
                    level: 1,
                    public: false,
                    title: "\u521D\u604B\u4EA4\u5F80",
                    text: "\u6B63\u5728\u4E0E\u540C\u6821\u7537\u751F\u4EA4\u5F80\uFF0C\u6B63\u5904\u4E8E\u521D\u604B\u671F\uFF0C\u5C1A\u672A\u53D1\u751F\u8FC7\u903E\u77E9\u7684\u4EB2\u5BC6\u8EAB\u4F53\u5173\u7CFB\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "target_romance_virgin_boundary",
                    slot: "romance",
                    level: 2,
                    public: false,
                    title: "\u7EAF\u60C5\u5E95\u7EBF",
                    text: "\u5468\u672B\u7EA6\u4F1A\u4EC5\u6B62\u4E8E\u7275\u624B\u4E0E\u5E76\u80A9\u6563\u6B65\uFF0C\u9762\u5BF9\u7537\u751F\u7684\u66F4\u8FDB\u4E00\u6B65\u8BD5\u63A2\u4F1A\u7F9E\u6DA9\u63A8\u62D2\uFF0C\u575A\u5B88\u6700\u540E\u4E00\u9053\u5E95\u7EBF\u3002",
                    place: null,
                    reveal_via: [
                      "hear_gossip",
                      "chat",
                      "watch_peers"
                    ]
                  },
                  {
                    id: "target_romance_virgin_core",
                    slot: "romance",
                    level: 3,
                    public: false,
                    title: "\u5904\u5B50\u4E4B\u8EAB",
                    text: "\u4ECD\u4FDD\u6709\u5B8C\u6574\u7684\u5904\u5973\u4E4B\u8EAB\uFF0C\u5BF9\u521D\u6B21\u7684\u4F53\u9A8C\u6000\u7740\u7F9E\u6DA9\u800C\u8C28\u614E\u7684\u73CD\u89C6\uFF0C\u89C6\u8EAB\u4F53\u7EAF\u6D01\u4E3A\u81EA\u8EAB\u5E95\u7EBF\u3002",
                    place: null,
                    reveal_via: [
                      "hear_gossip",
                      "pump_person",
                      "audit_class"
                    ]
                  }
                ]
              },
              {
                id: "experienced_in_love",
                name: "\u6709\u604B\u4EBA \u5DF2\u53D1\u751F\u5173\u7CFB",
                facts: [
                  {
                    id: "target_romance_exp_status",
                    slot: "romance",
                    level: 1,
                    public: false,
                    title: "\u4EB2\u5BC6\u4EA4\u5F80",
                    text: "\u4E0E\u540C\u6821\u7537\u751F\u7A33\u5B9A\u4EA4\u5F80\u4E2D\uFF0C\u4E24\u4EBA\u611F\u60C5\u6DF1\u539A\uFF0C\u5DF2\u6709\u8FC7\u5B9E\u8D28\u6027\u7684\u7537\u5973\u4EB2\u5BC6\u63A5\u89E6\u7ECF\u9A8C\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "target_romance_exp_boundary",
                    slot: "romance",
                    level: 2,
                    public: false,
                    title: "\u8FC7\u591C\u75D5\u8FF9",
                    text: "\u5468\u516D\u7EA6\u4F1A\u65F6\u5076\u5C14\u4F1A\u5728\u60C5\u4FA3\u65C5\u793E\u6216\u5BF9\u65B9\u51FA\u79DF\u5C4B\u8FC7\u591C\uFF0C\u9888\u4FA7\u6216\u9501\u9AA8\u95F4\u5076\u5C14\u9690\u7EA6\u7559\u6709\u6D45\u6DE1\u543B\u75D5\u3002",
                    place: null,
                    reveal_via: [
                      "hear_gossip",
                      "chat",
                      "watch_peers"
                    ]
                  },
                  {
                    id: "target_romance_exp_core",
                    slot: "romance",
                    level: 3,
                    public: false,
                    title: "\u8EAB\u4F53\u7ECF\u9A8C",
                    text: "\u867D\u5DF2\u975E\u5904\u5B50\u4E4B\u8EAB\uFF0C\u5BF9\u7537\u5973\u60C5\u4E8B\u5DF2\u6709\u5207\u5B9E\u8BA4\u77E5\uFF0C\u4F46\u5728\u5916\u4F9D\u7136\u4FDD\u6301\u7740\u77E5\u6027\u7AEF\u5E84\u7684\u5B66\u751F\u5F62\u8C61\u3002",
                    place: null,
                    reveal_via: [
                      "hear_gossip",
                      "pump_person",
                      "audit_class"
                    ]
                  }
                ]
              },
              {
                id: "single",
                name: "\u5355\u8EAB",
                facts: [
                  {
                    id: "target_romance_single_status",
                    slot: "romance",
                    level: 1,
                    public: false,
                    title: "\u72EC\u5C45\u5355\u8EAB",
                    text: "\u5F53\u524D\u5904\u4E8E\u5355\u8EAB\u65E0\u4EA4\u5F80\u5BF9\u8C61\u72B6\u6001\uFF0C\u72EC\u6765\u72EC\u5F80\uFF0C\u4EAB\u53D7\u65E0\u62D8\u65E0\u675F\u7684\u4E2A\u4EBA\u72EC\u7ACB\u751F\u6D3B\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "target_romance_single_boundary",
                    slot: "romance",
                    level: 2,
                    public: false,
                    title: "\u60C5\u611F\u7A7A\u767D",
                    text: "\u5076\u5C14\u53D7\u5230\u540C\u7CFB\u7537\u751F\u7684\u8FFD\u6C42\u4F46\u4ECE\u672A\u677E\u53E3\u7B54\u5E94\uFF0C\u60C5\u611F\u7ECF\u5386\u7A7A\u767D\uFF0C\u5BF9\u604B\u7231\u62B1\u6301\u89C2\u671B\u6001\u5EA6\u3002",
                    place: null,
                    reveal_via: [
                      "hear_gossip",
                      "chat",
                      "watch_peers"
                    ]
                  },
                  {
                    id: "target_romance_single_core",
                    slot: "romance",
                    level: 3,
                    public: false,
                    title: "\u672A\u6D89\u60C5\u4E8B",
                    text: "\u59CB\u7EC8\u4FDD\u6301\u7740\u672A\u66FE\u6D89\u8DB3\u7537\u5973\u60C5\u4E8B\u7684\u7EAF\u6D01\u8EAB\u5FC3\uFF0C\u4ECE\u672A\u4F53\u9A8C\u8FC7\u5F02\u6027\u7684\u89E6\u78B0\uFF0C\u8EAB\u4F53\u5904\u4E8E\u672A\u88AB\u5F00\u53D1\u72B6\u6001\u3002",
                    place: null,
                    reveal_via: [
                      "hear_gossip",
                      "pump_person",
                      "audit_class"
                    ]
                  }
                ]
              }
            ]
          },
          college: {
            id: "college",
            name: "\u72EC\u5C45\u5973\u5927\u5B66\u751F",
            stats: {
              str: 3,
              agi: 4,
              per: 4,
              nrv: 4
            },
            social: 3,
            alertMod: 0,
            traits: [
              "shoe_sneakers"
            ],
            stability: 0.8,
            flavor: {
              face: "\u7565\u5E26\u597D\u5947\u6216\u6212\u5907\u5730\u4FA7\u8FC7\u8138\uFF0C\u501F\u7740\u624B\u673A\u5C4F\u5E55\u7684\u53CD\u5149\u626B\u4E00\u773C\u8EAB\u540E",
              evade: "\u52A0\u5FEB\u6B65\u9891\u8D70\u5411\u4EBA\u591A\u660E\u4EAE\u5904\uFF0C\u6B65\u4F10\u5728\u77F3\u677F\u8DEF\u4E0A\u53D1\u51FA\u8282\u594F\u5206\u660E\u7684\u8F7B\u54CD",
              shield: "\u5728\u6CBF\u8857\u4FBF\u5229\u5E97\u6216\u5976\u8336\u5E97\u9A7B\u8DB3\uFF0C\u5047\u610F\u7FFB\u5305\u6216\u67E5\u770B\u624B\u673A\u70B9\u5355",
              signal: "\u6234\u4E0A\u8033\u9EA6\u6216\u7ED9\u5BA4\u53CB\u62E8\u901A\u8BED\u97F3\u7535\u8BDD\uFF0C\u8FB9\u8D70\u8FB9\u4F4E\u58F0\u8BF4\u8BDD"
            },
            defaultOutfit: {
              id: "outfit_hoodie_denim",
              name: "\u843D\u80A9\u8FDE\u5E3D\u536B\u8863+\u5BBD\u677E\u725B\u4ED4\u88E4",
              shoeId: "shoe_sneakers",
              shoeName: "\u6ED1\u677F\u978B",
              desc: "\u7C73\u7070\u8272\u843D\u80A9\u6293\u7ED2\u8FDE\u5E3D\u536B\u8863\u642D\u914D\u6C34\u6D17\u6D45\u84DD\u505A\u65E7\u76F4\u7B52\u9614\u817F\u62D6\u5730\u725B\u4ED4\u88E4\uFF0C\u6D45\u7070\u8272\u7EAF\u68C9\u5E73\u53E3\u8FD0\u52A8\u77ED\u889C\u914D\u767D\u7070\u62FC\u8272\u7ECF\u5178\u4F4E\u5E2E\u6ED1\u677F\u978B",
              prompt: "\u767D\u63CF\u7C73\u7070\u8272\u5BBD\u5927\u843D\u80A9\u536B\u8863\u4E0E\u6D45\u84DD\u9614\u817F\u62D6\u5730\u725B\u4ED4\u88E4\uFF0C\u6D45\u7070\u77ED\u889C\u642D\u7ECF\u5178\u6ED1\u677F\u978B\uFF0C\u5C55\u73B0\u968F\u6027\u653E\u677E\u3001\u6B65\u8C03\u677E\u5F1B\u7684\u5927\u5B66\u5973\u751F\u65E5\u5E38\u98CE\u8C8C"
            },
            outfits: [
              {
                id: "outfit_hoodie_denim",
                name: "\u843D\u80A9\u8FDE\u5E3D\u536B\u8863+\u5BBD\u677E\u725B\u4ED4\u88E4",
                styleGroup: "casual",
                shoeId: "shoe_sneakers",
                shoeName: "\u6ED1\u677F\u978B",
                socks: "\u6D45\u7070\u8272\u7EAF\u68C9\u5E73\u53E3\u8FD0\u52A8\u77ED\u889C",
                desc: "\u7C73\u7070\u8272\u843D\u80A9\u6293\u7ED2\u8FDE\u5E3D\u536B\u8863\u642D\u914D\u6C34\u6D17\u6D45\u84DD\u505A\u65E7\u76F4\u7B52\u9614\u817F\u62D6\u5730\u725B\u4ED4\u88E4\uFF0C\u6D45\u7070\u8272\u7EAF\u68C9\u5E73\u53E3\u8FD0\u52A8\u77ED\u889C\u914D\u767D\u7070\u62FC\u8272\u7ECF\u5178\u4F4E\u5E2E\u6ED1\u677F\u978B",
                prompt: "\u767D\u63CF\u5BBD\u5927\u843D\u80A9\u536B\u8863\u4E0B\u6446\u81EA\u7136\u5782\u843D\uFF0C\u6D45\u84DD\u9614\u817F\u725B\u4ED4\u88E4\u5FAE\u5806\u4E8E\u6ED1\u677F\u978B\u9762\uFF0C\u6D45\u7070\u5E73\u53E3\u77ED\u889C\u6536\u4E8E\u8E1D\u90E8\uFF0C\u6B65\u4F10\u677E\u6563\u62D6\u6C93"
              },
              {
                id: "outfit_tech_cargo",
                name: "\u9632\u98CE\u51B2\u950B\u5939\u514B+\u675F\u811A\u5DE5\u88C5\u88E4",
                styleGroup: "casual",
                shoeId: "shoe_sneakers",
                shoeName: "\u5E06\u5E03\u978B",
                socks: "\u9ED1\u8272\u87BA\u7EB9\u9AD8\u5F39\u4E2D\u7B52\u5438\u6C57\u68C9\u889C",
                desc: "\u58A8\u9ED1\u8FDE\u5E3D\u9632\u98CE\u51B2\u950B\u5939\u514B\u642D\u914D\u6DF1\u519B\u7EFF\u591A\u53E3\u888B\u675F\u811A\u5DE5\u88C5\u6162\u8DD1\u88E4\uFF0C\u7EAF\u9ED1\u87BA\u7EB9\u9AD8\u5F39\u4E2D\u7B52\u68C9\u889C\u914D\u9ED1\u767D\u62FC\u8272\u9AD8\u5E2E\u5E06\u5E03\u978B",
                prompt: "\u767D\u63CF\u58A8\u9ED1\u51B2\u950B\u5939\u514B\u5E26\u62BD\u7EF3\u659C\u62C9\u94FE\uFF0C\u5DE5\u88C5\u675F\u811A\u88E4\u5229\u843D\u6536\u53E3\uFF0C\u9ED1\u8272\u9AD8\u5F39\u87BA\u7EB9\u4E2D\u7B52\u889C\u5305\u88F9\u811A\u8E1D\uFF0C\u5E06\u5E03\u978B\u6B65\u9891\u8F7B\u5FEB\u5E26\u6709\u6A61\u80F6\u64E6\u5730\u58F0"
              },
              {
                id: "outfit_sailor_jk",
                name: "\u6B63\u7EDF\u6C34\u624B\u670DJK\u77ED\u88D9",
                styleGroup: "sweet",
                shoeId: "shoe_leather",
                shoeName: "\u4E50\u798F\u5C0F\u76AE\u978B",
                socks: "\u7EAF\u9ED1\u9AD8\u5F39\u7EAF\u68C9\u5C0F\u817F\u4E2D\u7B52\u889C",
                desc: "\u85CF\u9752\u8272\u6B63\u7EDF\u77ED\u6B3E\u5957\u5934\u6C34\u624B\u670D\uFF08\u53CC\u767D\u895F\u7EBF+\u6DF1\u7EA2\u5E73\u7ED3\uFF09\u914D\u540C\u8272\u9AD8\u8170\u767E\u8936\u77ED\u88D9\uFF0C\u7EAF\u9ED1\u9AD8\u5F39\u7EAF\u68C9\u5C0F\u817F\u4E2D\u7B52\u889C\uFF0C\u811A\u8E0F\u9ED1\u8272\u5706\u5934\u642D\u6263\u4EAE\u9762\u76AE\u4E50\u798F\u978B",
                prompt: "\u767D\u63CF\u85CF\u9752\u8272\u77ED\u6B3E\u6C34\u624B\u670D\u4E0E\u5FAE\u98CE\u4E0B\u8F7B\u626C\u7684\u767E\u8936\u77ED\u88D9\uFF0C\u7EAF\u9ED1\u5C0F\u817F\u4E2D\u7B52\u889C\u5E73\u6574\u52FE\u52D2\u5C0F\u817F\u8F6E\u5ED3\uFF0C\u6F06\u76AE\u4E50\u798F\u978B\u6572\u51FB\u5730\u9762\u53D1\u51FA\u6E05\u8106\u58F0\u54CD"
              },
              {
                id: "outfit_plaid_jk",
                name: "\u5976\u8336\u897F\u5F0F\u683C\u88D9JK\u5957\u88C5",
                styleGroup: "sweet",
                shoeId: "shoe_leather",
                shoeName: "\u5B66\u9662\u5C0F\u76AE\u978B",
                socks: "\u6D45\u7C73\u767D\u7EC6\u7EBF\u7EAF\u68C9\u5806\u5806\u889C",
                desc: "\u5976\u8336\u8272V\u9886\u9488\u7EC7\u80CC\u5FC3\u5185\u642D\u5C0F\u65B9\u9886\u767D\u886C\u886B\u4E0E\u683C\u7EB9\u8774\u8776\u7ED3\uFF0C\u7126\u7CD6\u674F\u8272\u538B\u8936\u683C\u7EB9\u767E\u8936\u77ED\u88D9\uFF0C\u6D45\u7C73\u767D\u7EC6\u7EBF\u7EAF\u68C9\u5806\u5806\u889C\uFF0C\u811A\u8E0F\u6DF1\u68D5\u54D1\u5149\u8F6F\u76AE\u5B66\u9662\u5C0F\u76AE\u978B",
                prompt: "\u767D\u63CF\u5976\u8336\u9488\u7EC7\u80CC\u5FC3\u4E0E\u7126\u7CD6\u683C\u7EB9\u77ED\u88D9\u7684\u5C42\u6B21\u611F\uFF0C\u6D45\u7C73\u767D\u5806\u5806\u889C\u5728\u8E1D\u90E8\u5FAE\u5806\u4E24\u6298\uFF0C\u54D1\u5149\u5C0F\u76AE\u978B\u811A\u6B65\u8F7B\u6377"
              },
              {
                id: "outfit_lolita_jsk",
                name: "\u5370\u82B1\u6258\u80F8Lolita\u88D9",
                styleGroup: "sweet",
                shoeId: "shoe_platform",
                shoeName: "\u739B\u4E3D\u73CD\u978B",
                socks: "\u7EAF\u767D\u5FAE\u900F\u63D0\u82B1\u9542\u7A7A\u8FC7\u819D\u957F\u7B52\u889C",
                desc: "\u8C61\u7259\u767D\u7ACB\u9886\u857E\u4E1D\u957F\u8896\u96EA\u7EBA\u886C\u886B\u642D\u6DF1\u9152\u7EA2\u661F\u6708\u6697\u7EB9\u9AD8\u8170JSK\u540A\u5E26\u88D9\uFF08\u53CC\u5C42\u857E\u4E1D\u8FB9\uFF09\uFF0C\u7EAF\u767D\u5FAE\u900F\u63D0\u82B1\u9542\u7A7A\u8FC7\u819D\u957F\u7B52\u889C\uFF0C\u6DF1\u9152\u7EA2\u539A\u5E95\u53CC\u642D\u6263\u739B\u4E3D\u73CD\u978B",
                prompt: "\u767D\u63CF\u6DF1\u9152\u7EA2\u84EC\u677E\u534E\u4E3D\u7684JSK\u88D9\u6446\u4E0E\u5C42\u53E0\u857E\u4E1D\u8FB9\uFF0C\u7EAF\u767D\u5FAE\u900F\u9542\u7A7A\u957F\u7B52\u889C\u88F9\u81F3\u8FC7\u819D\u5E76\u7CFB\u6709\u7F0E\u5E26\u8774\u8776\u7ED3\uFF0C\u539A\u5E95\u739B\u4E3D\u73CD\u978B\u8E0F\u51FA\u6C89\u91CD\u800C\u89C4\u77E9\u7684\u949D\u54CD"
              },
              {
                id: "outfit_floral_dress",
                name: "\u9488\u7EC7\u957F\u5F00\u886B+\u788E\u82B1\u540A\u5E26\u957F\u88D9",
                styleGroup: "elegant",
                shoeId: "shoe_flats",
                shoeName: "\u5E73\u5E95\u5355\u978B",
                socks: "\u7EAF\u767D\u8F7B\u8584\u900F\u6C14\u5377\u8FB9\u77ED\u68C9\u889C",
                desc: "\u8F6F\u7CEF\u71D5\u9EA6\u8272\u7C97\u7EBF\u957F\u6B3E\u9488\u7EC7\u5F00\u886B\u642D\u6DE1\u9EC4\u7EC6\u788E\u5C0F\u82B1\u96EA\u7EBA\u540A\u5E26\u957F\u88D9\uFF0C\u7EAF\u767D\u8F7B\u8584\u900F\u6C14\u5377\u8FB9\u77ED\u68C9\u889C\u5FAE\u9732\u4E8E\u6D45\u674F\u8272\u725B\u76AE\u5E73\u5E95\u8F6F\u5E95\u5355\u978B\u978B\u53E3",
                prompt: "\u767D\u63CF\u71D5\u9EA6\u8272\u9488\u7EC7\u5F00\u886B\u968F\u6B65\u6001\u5FAE\u655E\uFF0C\u6DE1\u9EC4\u788E\u82B1\u96EA\u7EBA\u957F\u88D9\u5782\u81F3\u5C0F\u817F\u809A\u8F7B\u67D4\u6446\u52A8\uFF0C\u5377\u8FB9\u77ED\u889C\u9690\u4E8E\u5E73\u5E95\u6D45\u53E3\u5355\u978B\u5185\uFF0C\u6B65\u8C03\u6E29\u548C\u7EC6\u5FAE"
              },
              {
                id: "outfit_cableknit_midiskirt",
                name: "\u9EBB\u82B1\u6BDB\u8863+\u6BDB\u5462\u767E\u8936\u4E2D\u957F\u88D9",
                styleGroup: "elegant",
                shoeId: "shoe_leather",
                shoeName: "\u7CFB\u5E26\u5C0F\u76AE\u978B",
                socks: "\u6DF1\u7070\u6DF7\u7EBA\u4FDD\u6696\u4E2D\u7B52\u539A\u68C9\u889C",
                desc: "\u6D45\u7070\u590D\u53E4\u7C97\u68D2\u9488\u9EBB\u82B1\u5957\u5934\u6BDB\u8863\u642D\u914D\u58A8\u7EFF\u8272\u539A\u6BDB\u5462\u5782\u611F\u538B\u8936\u4E2D\u957F\u88D9\uFF0C\u6DF1\u7070\u6DF7\u7EBA\u4FDD\u6696\u4E2D\u7B52\u539A\u68C9\u889C\uFF0C\u811A\u8E0F\u6DF1\u68D5\u8272\u7CFB\u5E26\u82F1\u4F26\u5C0F\u76AE\u978B",
                prompt: "\u767D\u63CF\u539A\u5B9E\u9EBB\u82B1\u6BDB\u8863\u5E26\u6765\u7AEF\u5E84\u4E66\u5377\u611F\uFF0C\u58A8\u7EFF\u539A\u5462\u88D9\u6446\u53CA\u81F3\u5C0F\u817F\u4E2D\u6BB5\u884C\u8D70\u6B65\u5E45\u514B\u5236\uFF0C\u6DF1\u7070\u4E2D\u7B52\u889C\u5E73\u6574\u6536\u675F\uFF0C\u7CFB\u5E26\u5C0F\u76AE\u978B\u53D1\u51FA\u6C89\u7A33\u7B03\u7B03\u58F0"
              },
              {
                id: "outfit_corduroy_overall",
                name: "\u9AD8\u9886\u6253\u5E95+\u706F\u82AF\u7ED2\u5DE5\u88C5\u80CC\u5E26\u957F\u88D9",
                styleGroup: "elegant",
                shoeId: "shoe_flats",
                shoeName: "\u5E73\u5E95\u8F6F\u76AE\u978B",
                socks: "\u59DC\u9EC4\u8272\u7AD6\u87BA\u7EB9\u7EAF\u68C9\u5C0F\u817F\u889C",
                desc: "\u6696\u767D\u534A\u9AD8\u9886\u7EC6\u7F57\u7EB9\u9488\u7EC7\u6253\u5E95\u886B\u5916\u642D\u6D45\u5361\u5176\u8272\u76F4\u7B52\u5DE5\u88C5\u80CC\u5E26\u957F\u88D9\uFF0C\u59DC\u9EC4\u8272\u7AD6\u87BA\u7EB9\u7EAF\u68C9\u5C0F\u817F\u889C\uFF0C\u811A\u8E0F\u6D45\u674F\u8272\u725B\u76AE\u5E73\u5E95\u8F6F\u5E95\u5355\u978B",
                prompt: "\u767D\u63CF\u6696\u767D\u9AD8\u9886\u4E0E\u6D45\u5361\u5176\u706F\u82AF\u7ED2\u957F\u88D9\u8D28\u611F\u6E29\u6DA6\uFF0C\u5F00\u8869\u5904\u5FAE\u9732\u59DC\u9EC4\u8272\u7AD6\u87BA\u7EB9\u5C0F\u817F\u889C\uFF0C\u6B65\u6001\u5B89\u7A33\u4F4E\u8C03"
              },
              {
                id: "outfit_leather_jacket_skirt",
                name: "\u77ED\u6B3E\u76AE\u5939\u514B+\u5305\u81C0\u76AE\u77ED\u88D9",
                styleGroup: "cool",
                shoeId: "shoe_platform",
                shoeName: "\u677E\u7CD5\u9A6C\u4E01\u9774",
                socks: "\u6DF1\u70AD\u7070\u827240D\u534A\u900F\u9AD8\u5F39\u8FDE\u88E4\u889C",
                desc: "\u54D1\u5149\u9ED1\u8272\u4FEE\u8EAB\u77ED\u6B3E\u76AE\u8D28\u673A\u8F66\u5939\u514B\u914D\u9AD8\u8170A\u5B57\u5305\u81C0\u76AE\u77ED\u88D9\uFF0C\u6DF1\u70AD\u7070\u827240D\u534A\u900F\u9AD8\u5F39\u8FDE\u88E4\u889C\uFF0C\u811A\u8E0F\u9ED1\u8272\u9F7F\u7EB9\u539A\u5E95\u677E\u7CD5\u9A6C\u4E01\u9774",
                prompt: "\u767D\u63CF\u786C\u633A\u9ED1\u76AE\u5939\u514B\u4E0E\u5229\u843D\u76AE\u77ED\u88D9\u52FE\u52D2\u7D27\u51D1\u8EAB\u5F62\uFF0C\u6DF1\u70AD\u7070\u534A\u900F\u8FDE\u88E4\u889C\u7D27\u81F4\u5305\u88F9\u53CC\u817F\uFF0C\u539A\u5E95\u9A6C\u4E01\u9774\u8E0F\u51FA\u5F3A\u786C\u800C\u6C89\u95F7\u7684\u811A\u6B65\u8282\u594F"
              },
              {
                id: "outfit_trench_pencil",
                name: "\u53CC\u6392\u6263\u957F\u98CE\u8863+\u6BDB\u5462\u4E00\u6B65\u88D9",
                styleGroup: "cool",
                shoeId: "shoe_leather",
                shoeName: "\u4F4E\u8DDF\u5C0F\u76AE\u978B",
                socks: "\u54D1\u5149\u7EAF\u9ED1\u5FAE\u538B\u4FEE\u817F\u4E2D\u7B52\u889C",
                desc: "\u9A7C\u8272\u957F\u6B3E\u53CC\u6392\u6263\u633A\u62EC\u7CFB\u5E26\u98CE\u8863\u5185\u642D\u9ED1\u8272\u9AD8\u9886\u886B\u4E0E\u6DF1\u7070\u7C97\u82B1\u5462\u9AD8\u8170\u4E00\u6B65\u76F4\u7B52\u88D9\uFF0C\u54D1\u5149\u7EAF\u9ED1\u5FAE\u538B\u4FEE\u817F\u4E2D\u7B52\u889C\uFF0C\u811A\u8E0F\u9ED1\u8272\u5C16\u5934\u4F4E\u8DDF\u5C0F\u76AE\u978B",
                prompt: "\u767D\u63CF\u9A7C\u8272\u98CE\u8863\u4E0B\u6446\u8FC7\u819D\u968F\u98CE\u5FAE\u626C\uFF0C\u6DF1\u7070\u4E00\u6B65\u88D9\u6536\u675F\u6B65\u5E45\uFF0C\u54D1\u5149\u7EAF\u9ED1\u4E2D\u7B52\u889C\u85CF\u4E8E\u88D9\u8FB9\uFF0C\u4F4E\u8DDF\u5C0F\u76AE\u978B\u5728\u77F3\u677F\u8857\u4E0A\u6572\u51FA\u6E05\u51B7\u575A\u5B9A\u7684\u58F0\u54CD"
              },
              {
                id: "outfit_preppy_layered",
                name: "\u5047\u4E24\u4EF6\u9488\u7EC7\u886B+\u683C\u7EB9\u767E\u8936\u77ED\u88D9",
                styleGroup: "sweet",
                shoeId: "shoe_leather",
                shoeName: "\u4E50\u798F\u5C0F\u76AE\u978B",
                socks: "\u6DF1\u85CF\u9752\u8272\u8FC7\u819D\u957F\u7B52\u68C9\u889C",
                desc: "\u6D45\u674F\u8272\u9EBB\u82B1\u7C97\u9488\u7EC7\u5F00\u886B\u5185\u62FC\u767D\u886C\u886B\u9886\uFF0C\u85CF\u9752\u9152\u7EA2\u7EC6\u683C\u7EB9\u9AD8\u8170\u767E\u8936\u77ED\u88D9\uFF0C\u6DF1\u85CF\u9752\u8272\u8FC7\u819D\u957F\u7B52\u68C9\u889C\uFF0C\u811A\u8E0F\u6DF1\u5496\u8272\u64E6\u8272\u590D\u53E4\u4E50\u798F\u5C0F\u76AE\u978B",
                prompt: "\u767D\u63CF\u5B66\u9662\u98CE\u9488\u7EC7\u5F00\u886B\u4E0E\u7EC6\u683C\u767E\u8936\u77ED\u88D9\u8F7B\u5FEB\u7075\u52A8\uFF0C\u6DF1\u85CF\u9752\u8FC7\u819D\u957F\u7B52\u889C\u4E0E\u88D9\u6446\u95F4\u9732\u51FA\u4E00\u622A\u808C\u80A4\uFF0C\u4E50\u798F\u5C0F\u76AE\u978B\u6B65\u5C65\u8F7B\u76C8\u8DF3\u8DC3"
              }
            ],
            somaticPool: [
              {
                id: "normal",
                name: "\u5E73\u5E38\u72B6\u6001",
                weight: 40,
                mod: {},
                desc: "\u57FA\u7EBF\u5E73\u6DE1\u665A\u5F52\uFF0C\u6B65\u5C65\u89C4\u5F8B",
                reasons: [
                  "\u666E\u901A\u7684\u665A\u81EA\u4E60\u7ED3\u675F\uFF0C\u6B65\u5C65\u8F7B\u6377\u5300\u79F0\uFF0C\u5FC3\u5883\u5E73\u548C",
                  "\u65E5\u5E38\u53BB\u56FE\u4E66\u9986\u8FD8\u5B8C\u4E66\u8FD4\u7A0B\uFF0C\u80CC\u7740\u5E06\u5E03\u5305\uFF0C\u5B89\u9759\u524D\u884C",
                  "\u6CA1\u6709\u7E41\u91CD\u7684\u5927\u4F5C\u4E1A\u5E72\u6270\uFF0C\u6309\u4E60\u60EF\u8282\u594F\u8D70\u5728\u8001\u8857\u8DEF\u4E0A"
                ],
                prompt: "\u767D\u63CF\u5176\u6B65\u5C65\u5747\u5300\u3001\u795E\u60C5\u8F7B\u677E\u7684\u5927\u5B66\u5973\u751F\u591C\u5F52\u5E38\u6001"
              },
              {
                id: "fatigued",
                name: "\u8EAB\u5FC3\u75B2\u60EB",
                weight: 25,
                mod: {
                  agi: -1
                },
                desc: "\u71AC\u591C\u8017\u795E\u6216\u517C\u804C\u5954\u6CE2\uFF0C\u6B65\u5C65\u62D6\u6C93\uFF0C\u654F\u6377 -1",
                reasons: [
                  "\u671F\u672B\u7ED3\u8BFE\u8FDE\u71AC\u4E24\u665A\u5927\u4F5C\u4E1A\u5C55\u793A\uFF0C\u7CBE\u795E\u56F0\u5026\uFF0C\u6B65\u5C65\u62D6\u6C93\u6C89\u91CD",
                  "\u5728\u6821\u5916\u517C\u804C\u7AD9\u7ACB\u4E86\u6570\u5C0F\u65F6\uFF0C\u5C0F\u817F\u9178\u80C0\u53D1\u786C\uFF0C\u8FC8\u6B65\u8FDF\u7F13",
                  "\u5728\u5B9E\u9A8C\u697C\u8FDE\u6D4B\u591A\u7EC4\u6570\u636E\uFF0C\u773C\u775B\u5E72\u6DA9\u53D1\u80C0\uFF0C\u4F4E\u5934\u62D6\u7740\u6B65\u5B50\u524D\u884C"
                ],
                prompt: "\u767D\u63CF\u5176\u8EAB\u5FC3\u56F0\u5026\u3001\u6B65\u4F10\u6C89\u7F13\u53D1\u62D6\u7684\u75B2\u60EB\u4F53\u6001\uFF0C\u80A9\u8180\u7565\u5FAE\u584C\u4E0B"
              },
              {
                id: "relaxed",
                name: "\u8F7B\u677E\u60EC\u610F",
                weight: 20,
                mod: {
                  per: -1
                },
                desc: "\u5FC3\u5883\u677E\u5F1B\u6109\u5FEB\uFF0C\u6CE8\u610F\u529B\u5206\u6563\uFF0C\u6709\u6548\u654F\u9510 -1",
                reasons: [
                  "\u671F\u672B\u5C0F\u7EC4\u7B54\u8FA9\u62FF\u4E86\u9AD8\u5206\uFF0C\u5FC3\u60C5\u8F7B\u677E\uFF0C\u6B65\u4F10\u8F7B\u5FEB\u5730\u6643\u7740\u5E06\u5E03\u5305",
                  "\u8DEF\u8FC7\u6392\u961F\u5F88\u4E45\u7684\u996E\u54C1\u5E97\u521A\u597D\u4E70\u5230\u62DB\u724C\u70ED\u996E\uFF0C\u6EE1\u8138\u60EC\u610F",
                  "\u521A\u6536\u5230\u5FC3\u4EEA\u5B9E\u4E60\u5C97\u4F4D\u7684\u521D\u5BA1\u901A\u8FC7\u901A\u77E5\uFF0C\u770B\u7740\u624B\u673A\u5634\u89D2\u5E26\u7B11",
                  "\u5468\u672B\u7EA6\u597D\u548C\u540C\u4F34\u53BB\u901B\u5C55\u62CD\u7167\uFF0C\u811A\u6B65\u8F7B\u6377\uFF0C\u5634\u91CC\u8F7B\u54FC\u7740\u6B4C"
                ],
                prompt: "\u767D\u63CF\u5176\u795E\u60C5\u6109\u60A6\u3001\u6B65\u4F10\u8F7B\u5FEB\u8212\u5C55\u3001\u5BF9\u8EAB\u540E\u6BEB\u65E0\u9632\u5907\u7684\u677E\u5F1B\u4F53\u6001"
              },
              {
                id: "rushing",
                name: "\u7D27\u7EF7\u8D76\u8DEF",
                weight: 15,
                mod: {
                  agi: 1
                },
                desc: "\u95E8\u7981\u4E34\u8FD1\u6216\u5929\u6C14\u7A81\u53D8\uFF0C\u8EAB\u4F53\u5FAE\u524D\u503E\u5FEB\u6B65\u75BE\u8D70\uFF0C\u654F\u6377 +1",
                reasons: [
                  "\u8DDD\u79BB\u516C\u5BD3\u5927\u95E8\u95E8\u7981\u9501\u95E8\u53EA\u5269\u6700\u540E\u5341\u5206\u949F\uFF0C\u751F\u6015\u88AB\u963F\u59E8\u8BB0\u540D\uFF0C\u5C0F\u8DD1\u5FEB\u8D70\u62A2\u65F6\u95F4",
                  "\u591C\u7A7A\u5FFD\u7136\u98D8\u8D77\u96F6\u661F\u51B7\u96E8\u4E14\u672A\u5E26\u96E8\u4F1E\uFF0C\u4F4E\u5934\u62A4\u4F4F\u6000\u91CC\u7684\u7535\u8111\u5305\u75BE\u6B65\u524D\u51B2"
                ],
                prompt: "\u767D\u63CF\u5176\u8EAB\u4F53\u5FAE\u524D\u503E\u3001\u6B65\u9891\u6025\u4FC3\u3001\u9891\u9891\u770B\u624B\u673A\u65F6\u95F4\u786E\u8BA4\u8DEF\u7A0B\u7684\u5306\u5FD9\u4F53\u6001"
              }
            ],
            handPool: {
              siteOverrides: {
                campus_library_b: {
                  id: "bag_pack",
                  name: "\u6574\u7406\u4E66\u5305",
                  fumbling: true,
                  desc: "\u5728\u56FE\u4E66\u9986\u95ED\u9986\u95E8\u524D\u53F0\u9636\u4E0A\u505C\u6B65\uFF0C\u628A\u501F\u9605\u4E66\u7C4D\u4E0E\u4FDD\u6E29\u676F\u88C5\u5165\u5E06\u5E03\u5305\u5E76\u62C9\u597D\u62C9\u94FE"
                },
                school_gate_b: {
                  id: "phone_scan",
                  name: "\u5237\u7801\u51FA\u6821",
                  fumbling: false,
                  desc: "\u5728\u6821\u95E8\u53E3\u95F8\u673A\u524D\u70B9\u4EAE\u624B\u673A\u51FA\u793A\u6821\u56ED\u7801"
                },
                old_skybridge_b: {
                  id: "bag_tidy",
                  name: "\u6574\u7406\u80CC\u5305",
                  fumbling: true,
                  desc: "\u5728\u8001\u6C34\u6CE5\u5929\u6865\u907F\u98CE\u5904\u505C\u6B65\uFF0C\u62C9\u5F00\u5E06\u5E03\u5305\u6574\u7406\u8BFE\u672C\u4E0E\u6298\u53E0\u96E8\u4F1E"
                },
                old_metro_b: {
                  id: "metro_scan",
                  name: "\u5237\u5361\u51FA\u7AD9",
                  fumbling: true,
                  desc: "\u5728\u5730\u94C1\u51FA\u7AD9\u95F8\u673A\u524D\u505C\u6B65\uFF0C\u4ECE\u5927\u8863\u53E3\u888B\u6216\u5C0F\u5305\u7FFB\u627E\u4E58\u8F66\u7801\u4E0E\u8033\u673A\u76D2"
                },
                store_24h_b: {
                  id: "drink_takeout",
                  name: "\u53D6\u5916\u5E26\u70ED\u996E",
                  fumbling: false,
                  desc: "\u5728\u4FBF\u5229\u5E97\u67DC\u53F0\u524D\u6838\u5BF9\u5C0F\u7968\u5E76\u63A5\u8FC7\u6253\u5305\u7EB8\u888B"
                },
                unit_stairs_b: {
                  id: "key_fumble_flat",
                  name: "\u6478\u7D22\u94A5\u5319",
                  fumbling: true,
                  desc: "\u5728\u660F\u6697\u8001\u65E7\u5355\u5143\u697C\u5165\u53E3\u505C\u6B65\uFF0C\u62C9\u5F00\u5355\u80A9\u5305\u62C9\u94FE\u6478\u7D22\u51FA\u79DF\u5C4B\u9632\u76D7\u95E8\u94A5\u5319"
                }
              },
              carriagePool: [
                {
                  id: "carriage_normal",
                  name: "\u6276\u624B\u4E58\u8F66",
                  weight: 45,
                  duration: 1,
                  tag: null,
                  desc: "\u5355\u624B\u62C9\u7740\u8F66\u53A2\u540A\u73AF\u6216\u9760\u6276\u624B\u7AD9\u7ACB\uFF0C\u671B\u5411\u6F06\u9ED1\u8F66\u7A97\u53D1\u5446\uFF0C\u53CC\u624B\u5904\u4E8E\u7A7A\u95F2\u6001"
                },
                {
                  id: "carriage_phone",
                  name: "\u6234\u8033\u673A\u5237\u89C6\u9891",
                  weight: 35,
                  duration: 1,
                  tag: "hand_phone",
                  desc: "\u5934\u6234\u5F0F\u8033\u9EA6\u7F69\u5728\u8033\u8FB9\uFF0C\u53CC\u624B\u6A2A\u5C4F\u770B\u77ED\u89C6\u9891\u6216\u7F51\u8BFE\uFF0C\u5916\u754C\u58F0\u54CD\u4E0E\u89C6\u7EBF\u5B8C\u5168\u9694\u7EDD\uFF0C\u8DDF\u7F00\u9690\u853D +2"
                },
                {
                  id: "carriage_doze",
                  name: "\u501A\u9760\u778C\u7761",
                  weight: 20,
                  duration: 1,
                  tag: "hand_fumble",
                  desc: "\u501A\u7740\u8F66\u53A2\u7ACB\u67F1\u968F\u7740\u5217\u8F66\u98A0\u7C38\u8F7B\u8F7B\u5782\u5934\u6253\u778C\u7761\uFF0C\u53CC\u624B\u642D\u5728\u6000\u91CC\u7684\u5E06\u5E03\u5305\u4E0A\uFF0C\u611F\u77E5\u964D\u81F3\u4F4E\u70B9"
                }
              ],
              enRoute: [
                {
                  id: "normal",
                  name: "\u6B63\u5E38\u6446\u81C2",
                  weight: 30,
                  duration: 2,
                  tag: null,
                  desc: "\u5355\u80A9\u80CC\u7740\u5305\uFF0C\u53CC\u624B\u81EA\u7136\u7A7A\u95F2\u6446\u81C2\uFF0C\u53CD\u5E94\u7075\u654F"
                },
                {
                  id: "phone_chat",
                  name: "\u4F4E\u5934\u6253\u5B57",
                  weight: 25,
                  duration: 2,
                  tag: "hand_phone",
                  desc: "\u53CC\u624B\u6367\u624B\u673A\u98DE\u5FEB\u6253\u5B57\u56DE\u6D88\u606F\uFF0C\u89C6\u7EBF\u7D27\u76EF\u5C4F\u5E55\uFF0C\u73A9\u5BB6\u9690\u853D +2"
                },
                {
                  id: "hold_laptop",
                  name: "\u53CC\u624B\u62B1\u7535\u8111\u5305",
                  weight: 15,
                  duration: 2,
                  tag: "hand_book",
                  desc: "\u53CC\u624B\u628A\u539A\u91CD\u7535\u8111\u5305\u6216\u753B\u677F\u62A4\u5728\u80F8\u524D\uFF0C\u884C\u52A8\u8FDF\u6EDE\uFF0C\u9047\u88AD\u53CD\u6297\u6218\u529B -1"
                },
                {
                  id: "drink_milktea",
                  name: "\u559D\u70ED\u996E",
                  weight: 15,
                  duration: 1,
                  tag: "hand_drink",
                  desc: "\u5355\u624B\u63D0\u7740\u7EB8\u676F\u54AC\u7740\u5438\u7BA1\u5C0F\u53E3\u555C\u996E\uFF0C\u5355\u624B\u5360\u7528\uFF0C\u53CD\u6297\u6218\u529B -1"
                },
                {
                  id: "hands_pocket",
                  name: "\u53CC\u624B\u63D2\u515C",
                  weight: 15,
                  duration: 2,
                  tag: "hand_pocket",
                  desc: "\u53CC\u624B\u63D2\u5728\u536B\u8863\u524D\u515C\u6216\u5916\u5957\u53E3\u888B\u53D6\u6696\uFF0C\u9047\u88AD\u62D4\u624B\u53CD\u6297\u5EF6\u8FDF -2"
                }
              ]
            },
            routes: [
              {
                id: "college_evening",
                days: [
                  1,
                  2,
                  3,
                  4
                ],
                note: "\u5468\u5185\u665A\u81EA\u4E60\u5E38\u89C4\u8FD4\u7A0B\u8DEF\u7EBF\uFF08\u81EA\u4E60\u95ED\u9986\u540E\u5F52\u5BDD\uFF09",
                prompt: "\u767D\u63CF\u79CB\u591C\u665A\u81EA\u4E60\u95ED\u9986\u540E\u7684\u665A\u98CE\u4E0E\u6821\u95E8\u4EBA\u6D41\uFF0C\u624B\u63D0\u5E06\u5E03\u5305\u72EC\u81EA\u8D70\u51FA\u6821\u95E8\uFF0C\u8E0F\u7740\u591C\u8272\u7A7F\u8FC7\u8001\u5929\u6865\u4E0E\u4FBF\u5229\u5E97\uFF0C\u6B65\u5C65\u8F7B\u6377\u8D70\u56DE\u51FA\u79DF\u5C4B",
                path: [
                  {
                    place: "school_gate_b",
                    t: "2130"
                  },
                  {
                    place: "old_skybridge_b",
                    t: "2145"
                  },
                  {
                    place: "store_24h_b",
                    t: "2200"
                  },
                  {
                    place: "old_alley_main_b",
                    t: "2215"
                  },
                  {
                    place: "unit_stairs_b",
                    t: "2230"
                  }
                ]
              },
              {
                id: "college_delay_evening",
                days: [
                  1,
                  2,
                  3,
                  4,
                  5
                ],
                note: "\u5C0F\u7EC4\u4F5C\u4E1A\u5EF6\u8BEF\u6DF1\u591C\u5F52\u9014\uFF08\u8D77\u70B9\u63A8\u8FDF40\u5206\u949F\u81F322:10\uFF0C\u6DF1\u591C\u8857\u9053\u7A7A\u65F7\uFF09",
                prompt: "\u767D\u63CF\u5C0F\u7EC4\u5927\u4F5C\u4E1A\u6216\u5B9E\u9A8C\u7ED3\u9898\u8BA8\u8BBA\u5EF6\u8BEF\u81F3\u6DF1\u591C\uFF0C22:10 \u65B9\u624D\u5306\u5FD9\u6B65\u51FA\u7D27\u9501\u4FA7\u95E8\u7684\u6821\u95E8\u3002\u6DF1\u591C\u8857\u9053\u884C\u4EBA\u7A00\u5C11\u3001\u51B7\u98CE\u5439\u8FC7\u6811\u68A2\uFF0C\u6000\u62B1\u7B14\u8BB0\u672C\u7535\u8111\u4F4E\u5934\u5FEB\u6B65\u75BE\u884C",
                path: [
                  {
                    place: "school_gate_b",
                    t: "2210"
                  },
                  {
                    place: "school_bus_terminal_b",
                    t: "2225"
                  },
                  {
                    place: "old_alley_main_b",
                    t: "2240"
                  },
                  {
                    place: "dark_blind_alley_b",
                    t: "2255"
                  },
                  {
                    place: "unit_stairs_b",
                    t: "2310"
                  }
                ]
              },
              {
                id: "college_friday_night",
                days: [
                  5
                ],
                note: "\u5468\u4E94\u5C0F\u5403\u8857\u4E0E\u6362\u4E58\u5730\u94C1\u665A\u5F52\u8DEF\u7EBF",
                prompt: "\u767D\u63CF\u5468\u4E94\u665A\u4E0E\u540C\u5B66\u805A\u9910\u6216\u901B\u8857\u540E\u4E58\u5730\u94C1\u8FD4\u7A0B\uFF0C\u5728\u8001\u8857\u5730\u94C1\u7AD9\u51FA\u7AD9\uFF0C\u624B\u91CC\u63D0\u7740\u5C0F\u5403\u7EB8\u888B\u6216\u5976\u8336\uFF0C\u6B65\u5C65\u677E\u5F1B\u60EC\u610F\u5730\u8D70\u5411\u51FA\u79DF\u5C4B",
                path: [
                  {
                    place: "old_metro_b",
                    t: "2140"
                  },
                  {
                    place: "old_park_b",
                    t: "2155"
                  },
                  {
                    place: "old_alley_main_b",
                    t: "2210"
                  },
                  {
                    place: "unit_stairs_b",
                    t: "2225"
                  }
                ]
              },
              {
                id: "saturday_cram",
                days: [
                  6
                ],
                note: "\u5468\u516D\u81EA\u4E60\u5BA4\u5907\u8003\u665A\u5F52\u8DEF\u7EBF\uFF08\u62B1\u7740\u539A\u91CD\u8D44\u6599\u72EC\u884C\u5F52\u5BDD\uFF09",
                prompt: "\u767D\u63CF\u5468\u516D\u5168\u5929\u5728\u81EA\u4E60\u5BA4\u5237\u9898\u5907\u8003\u540E\u7684\u75B2\u5026\u4E0E\u6C89\u9759\uFF0C\u7A7F\u642D\u968F\u6027\uFF0C\u62B1\u7740\u539A\u91CD\u53C2\u8003\u4E66\u72EC\u81EA\u7A7F\u8FC7\u660F\u6697\u8001\u5DF7",
                path: [
                  {
                    place: "store_24h_b",
                    t: "1900"
                  },
                  {
                    place: "old_alley_main_b",
                    t: "1920"
                  },
                  {
                    place: "dark_blind_alley_b",
                    t: "1935"
                  },
                  {
                    place: "unit_stairs_b",
                    t: "1950"
                  }
                ]
              },
              {
                id: "saturday_outing",
                days: [
                  6
                ],
                note: "\u5468\u516D\u5546\u5708\u770B\u5C55\u805A\u4F1A\u5F52\u6765\u8DEF\u7EBF\uFF08\u5730\u94C1\u7AD9\u6563\u5FC3\u5F52\u6765\uFF0C\u624B\u6367\u996E\u54C1\uFF09",
                prompt: "\u767D\u63CF\u5468\u672B\u5916\u51FA\u901B\u5C55\u805A\u4F1A\u540E\u7684\u8F7B\u677E\u6B22\u5FEB\uFF0C\u62CE\u7740\u5C0F\u7EB8\u888B\uFF0C\u8FB9\u8D70\u8FB9\u770B\u624B\u673A\uFF0C\u6B65\u5C65\u8F7B\u6377\u8212\u5C55",
                path: [
                  {
                    place: "old_metro_b",
                    t: "2030"
                  },
                  {
                    place: "old_park_b",
                    t: "2050"
                  },
                  {
                    place: "store_24h_b",
                    t: "2110"
                  },
                  {
                    place: "unit_stairs_b",
                    t: "2130"
                  }
                ]
              },
              {
                id: "saturday_date_home",
                days: [
                  6
                ],
                note: "\u5468\u516D\u9752\u6DA9\u7EA6\u4F1A\xB7\u9001\u522B\u56DE\u5BB6\u8DEF\u7EBF\uFF08\u4F9D\u4F9D\u4E0D\u820D\u544A\u522B\u7537\u751F\u540E\u72EC\u81EA\u8D76\u95E8\u7981\uFF09",
                prompt: "\u767D\u63CF\u9752\u6DA9\u60C5\u4FA3\u95F4\u79BB\u522B\u65F6\u7684\u4F9D\u604B\u4E0E\u7F9E\u6DA9\uFF0C\u5341\u6307\u76F8\u6263\u53C8\u677E\u5F00\u7684\u5C40\u4FC3\u544A\u522B\uFF0C\u968F\u540E\u5C11\u5973\u4F4E\u5934\u786E\u8BA4\u65F6\u95F4\u5C0F\u6B65\u5FEB\u8D70\u62A2\u95E8\u7981",
                path: [
                  {
                    place: "old_metro_b",
                    t: "2140"
                  },
                  {
                    place: "old_park_b",
                    t: "2155"
                  },
                  {
                    place: "old_alley_main_b",
                    t: "2205"
                  },
                  {
                    place: "unit_stairs_b",
                    t: "2215"
                  }
                ]
              },
              {
                id: "saturday_date_hotel",
                days: [
                  6
                ],
                note: "\u5468\u516D\u9752\u6DA9\u7EA6\u4F1A\xB7\u60C5\u4FA3\u65C5\u793E\u7279\u6B8A\u8D70\u5411\uFF08\u60C5\u4FA3\u76F8\u4F34\u8FC8\u5165\u60C5\u4FA3\u65C5\u793E\uFF09",
                prompt: "\u767D\u63CF\u9752\u6DA9\u60C5\u4FA3\u521D\u6B21\u7275\u624B\u7684\u5C40\u4FC3\u4E0E\u5A07\u7F9E\uFF0C\u7EAF\u771F\u604B\u7231\u7684\u5FAE\u751C\u4E0E\u6069\u7231\u3002\u4E24\u4EBA\u5341\u6307\u7D27\u6263\uFF0C\u5E76\u80A9\u62D0\u5165\u4E00\u6761\u964C\u751F\u72ED\u7A84\u7684\u504F\u50FB\u4FA7\u5DF7\u6DF1\u5904\uFF1B\u5C11\u5973\u5FC3\u8DF3\u5FAE\u5FEB\u3001\u638C\u5FC3\u6CDB\u8D77\u7EC6\u6C57\uFF0C\u5E26\u7740\u5BF9\u8DE8\u5165\u5927\u4EBA\u4E16\u754C\u7684\u5411\u5F80\u4E0E\u7D27\u5F20\u3002\u4E25\u7981\u63D0\u524D\u5267\u900F\u76EE\u7684\u5730\u5177\u4F53\u540D\u79F0\u3002",
                path: [
                  {
                    place: "old_metro_b",
                    t: "2140"
                  },
                  {
                    place: "old_park_b",
                    t: "2155"
                  },
                  {
                    place: "old_alley_main_b",
                    t: "2210"
                  },
                  {
                    place: "love_hotel_b",
                    t: "2220"
                  }
                ]
              },
              {
                id: "sunday_rest",
                days: [
                  7
                ],
                note: "\u5468\u65E5\u5168\u5929\u5C45\u5BB6\u4F11\u6574\uFF08\u4E0D\u51FA\u95E8\uFF09",
                prompt: "\u767D\u63CF\u5973\u5927\u5B66\u751F\u5468\u65E5\u5168\u5929\u5728\u51FA\u79DF\u5C4B\u5185\u5B89\u9759\u4F11\u6574\u3001\u8865\u89C9\u6216\u6574\u7406\u5185\u52A1\uFF0C\u7A97\u5E18\u62C9\u8D77\uFF0C\u672A\u66FE\u5916\u51FA\uFF0C\u8857\u9053\u4E0A\u65E0\u5176\u8DB3\u8FF9",
                path: [
                  {
                    place: "unit_stairs_b",
                    t: "2000"
                  }
                ]
              }
            ],
            conditions: [
              {
                id: "roommate_walk",
                title: "\u5BA4\u53CB\u540C\u884C",
                mod: 1
              },
              {
                id: "express_pickup",
                title: "\u987A\u8DEF\u53D6\u4EF6",
                mod: 1
              },
              {
                id: "ddl_delay",
                title: "\u4F5C\u4E1A\u5EF6\u8BEF",
                mod: 2
              }
            ],
            factPool: [
              {
                id: "college_home_area",
                slot: "home",
                level: 1,
                public: false,
                title: "\u79DF\u4F4F\u7247\u533A",
                text: "\u72EC\u5C45\u5728\u8001\u57CE\u6587\u6559\u533A\u8FB9\u7F18\u7684\u8001\u5F0F\u5F04\u5802\u5185\uFF0C\u8DDD\u79BB\u5927\u5B66\u6B63\u95E8\u6B65\u884C\u7EA6\u5341\u4E94\u5206\u949F\u8DEF\u7A0B\u3002",
                place: null,
                reveal_via: []
              },
              {
                id: "college_home_building",
                slot: "home",
                level: 2,
                public: false,
                title: "\u4F4F\u5904\u697C\u680B",
                text: "\u79DF\u4F4F\u5728\u8001\u65E7\u7EA2\u7816\u4F4F\u5B85\u697C\u4E09\u5C42\uFF0C\u5F04\u5802\u8FC7\u9053\u672A\u8BBE\u8DEF\u706F\uFF0C\u697C\u9053\u5916\u5899\u722C\u7740\u67AF\u85E4\u4E0E\u8001\u5316\u6392\u6C34\u7BA1\u3002",
                place: "unit_stairs_b",
                reveal_via: [
                  "follow",
                  "stakeout"
                ]
              },
              {
                id: "college_home_door",
                slot: "home",
                level: 3,
                public: false,
                title: "\u95E8\u724C\u4E0E\u9501\u5177",
                text: "\u95E8\u724C302\uFF0C\u8001\u5F0F\u53CC\u6392\u5F39\u5B50\u9501\uFF0C\u95E8\u6846\u4E0A\u65B9\u8D34\u7740\u5916\u5356\u9632\u7AA5\u8D34\u7EB8\uFF0C\u95E8\u57AB\u4E0B\u672A\u85CF\u5907\u7528\u94A5\u5319\u3002",
                place: "unit_stairs_b",
                reveal_via: [
                  "ransack",
                  "door_peep",
                  "try_handle"
                ]
              },
              {
                id: "college_sched_library",
                slot: "schedule",
                level: 1,
                public: false,
                title: "\u81EA\u4E60\u95ED\u9986\u65F6\u95F4",
                text: "\u5E73\u65E5\u665A\u81EA\u4E60\u56FA\u5B9A\u572821:30\u79BB\u5F00\u56FE\u4E66\u9986\u95ED\u9986\u6B65\u51FA\u6821\u95E8\uFF0C\u6B65\u901F\u5300\u79F0\uFF0C\u4E60\u60EF\u4F4E\u5934\u770B\u624B\u673A\u3002",
                place: "school_gate_b",
                reveal_via: []
              },
              {
                id: "college_sched_store",
                slot: "schedule",
                level: 2,
                public: false,
                title: "\u4FBF\u5229\u5E97\u505C\u6B65",
                text: "\u5F52\u9014\u4E60\u60EF\u5728\u8001\u5929\u6865\u4E0B\u7684\u4FBF\u5229\u5E97\u77ED\u6682\u505C\u7559\u4E70\u6E29\u70ED\u5976\u54C1\uFF0C\u5468\u516D\u508D\u665A\u82E5\u4E0D\u51FA\u6E38\u5C31\u4F1A\u53BB\u81EA\u4E60\u5BA4\u5907\u8003\u3002",
                place: "store_24h_b",
                reveal_via: [
                  "follow",
                  "stakeout"
                ]
              },
              {
                id: "college_sched_ddl",
                slot: "schedule",
                level: 3,
                public: false,
                title: "\u4F5C\u4E1A\u7ED3\u8BFE\u5EF6\u8BEF",
                text: "\u9047\u5B9E\u9A8C\u7ED3\u9898\u6216\u5927\u4F5C\u4E1A\u6C47\u62A5\uFF0C\u79BB\u6821\u65F6\u95F4\u5FC5\u5B9A\u63A8\u8FDF40\u5206\u949F\u81F322:10\uFF0C\u72EC\u81EA\u7A7F\u8FC7\u6DF1\u591C\u7A7A\u65F7\u6697\u5DF7\u3002",
                place: "school_gate_b",
                reveal_via: [
                  "ransack",
                  "pump_person",
                  "audit_class"
                ]
              },
              {
                id: "college_carry_bag",
                slot: "carry",
                level: 1,
                public: true,
                title: "\u968F\u8EAB\u5305\u888B",
                text: "\u5355\u80A9\u7C73\u767D\u8272\u539A\u5E06\u5E03\u5305\uFF0C\u4FA7\u888B\u63D2\u7740\u6298\u53E0\u6674\u96E8\u4F1E\u4E0E\u4FDD\u6E29\u6C34\u676F\uFF0C\u8D70\u8DEF\u65F6\u4E60\u60EF\u5355\u624B\u62A4\u5728\u8EAB\u4FA7\u3002",
                place: null,
                reveal_via: []
              },
              {
                id: "college_carry_daily",
                slot: "carry",
                level: 2,
                public: false,
                title: "\u5305\u5185\u5E38\u5907\u7269",
                text: "\u5E06\u5E03\u5305\u5185\u5E38\u5907\uFF1A\u6821\u56ED\u4E00\u5361\u901A\u3001\u964D\u566A\u8033\u9EA6\u76D2\u3001\u8367\u5149\u7B14\u4E0E\u8584\u8377\u6DA6\u5589\u7CD6\u3001\u51FA\u79DF\u5C4B\u94A5\u5319\u4E32\u3002",
                place: null,
                reveal_via: [
                  "photo",
                  "scan",
                  "listen",
                  "note"
                ]
              },
              {
                id: "college_carry_defense",
                slot: "carry",
                level: 3,
                public: false,
                title: "\u4FBF\u643A\u9632\u8EAB\u7269",
                text: "\u5305\u5185\u6697\u683C\u5939\u5C42\u85CF\u7740\u4E00\u74F6\u5FAE\u578B\u9632\u72FC\u55B7\u96FE\u4E0E\u4E00\u628A\u5C0F\u5DE7\u7684\u7F8E\u5DE5\u88C1\u7EB8\u5200\uFF0C\u9632\u5907\u5FC3\u91CD\u4F46\u62FF\u53D6\u7565\u663E\u8FDF\u6EDE\u3002",
                place: null,
                reveal_via: [
                  "pick",
                  "ransack"
                ]
              },
              {
                id: "college_social_circle",
                slot: "social",
                level: 1,
                public: false,
                title: "\u4EBA\u9645\u758F\u5BC6",
                text: "\u5728\u8FD9\u5EA7\u57CE\u5E02\u6CA1\u6709\u4EB2\u5C5E\uFF0C\u4EBA\u9645\u5708\u76F8\u5BF9\u5C01\u95ED\uFF0C\u9664\u540C\u7CFB\u540C\u4E13\u4E1A\u540C\u5B66\u5916\u9C9C\u5C11\u4E0E\u5916\u754C\u6DF1\u5165\u6765\u5F80\u3002",
                place: null,
                reveal_via: []
              },
              {
                id: "college_social_roommate",
                slot: "social",
                level: 2,
                public: false,
                title: "\u7ED3\u4F34\u540C\u4F34",
                text: "\u665A\u81EA\u4E60\u5076\u5C14\u4E0E\u77ED\u53D1\u540C\u7CFB\u5BA4\u53CB\u7ED3\u4F34\u8D70\u51FA\u6821\u95E8\uFF0C\u884C\u81F3\u5929\u6865\u5206\u5C94\u8DEF\u53E3\u544A\u522B\u540E\u5404\u81EA\u72EC\u884C\u3002",
                place: "school_gate_b",
                reveal_via: [
                  "watch_peers"
                ]
              },
              {
                id: "college_social_crush",
                slot: "social",
                level: 3,
                public: false,
                title: "\u66A7\u6627\u5FC3\u4E8B",
                text: "\u4E0E\u540C\u7EC4\u505A\u9879\u76EE\u7684\u5B66\u957F\u4FDD\u6301\u7740\u82E5\u5373\u82E5\u79BB\u7684\u597D\u611F\uFF0C\u5468\u516D\u5076\u5C14\u53D7\u9080\u770B\u5C55\uFF0C\u4F46\u8981\u5F3A\u7684\u81EA\u5C0A\u5FC3\u8BA9\u5979\u4ECE\u672A\u4E3B\u52A8\u8868\u767D\u3002",
                place: null,
                reveal_via: [
                  "hear_gossip",
                  "pump_person",
                  "audit_class"
                ]
              },
              {
                id: "college_psyche_facade_l1",
                slot: "psyche",
                level: 1,
                public: false,
                title: "\u81EA\u5C0A\u77DC\u6301",
                text: "\u795E\u60C5\u81EA\u77DC\uFF0C\u81EA\u5C0A\u5FC3\u8981\u5F3A\uFF0C\u7EDD\u4E0D\u8F7B\u6613\u5728\u751F\u4EBA\u9762\u524D\u793A\u5F31\u9732\u51FA\u614C\u5F20\u795E\u6001\u3002",
                place: null,
                reveal_via: []
              },
              {
                id: "college_psyche_facade_l2",
                slot: "psyche",
                level: 2,
                public: false,
                title: "\u786C\u6491\u5FEB\u8D70",
                text: "\u6DF1\u591C\u906D\u9047\u5F02\u6837\u76EE\u5149\u6216\u7D27\u903C\u65F6\uFF0C\u4F1A\u6B7B\u6B7B\u54AC\u4F4F\u4E0B\u5507\u52A0\u5FEB\u6B65\u4F10\u786C\u6491\uFF0C\u7EDD\u4E0D\u4E3B\u52A8\u6C42\u9976\u547C\u6551\u3002",
                place: null,
                reveal_via: [
                  "greet",
                  "chat"
                ]
              },
              {
                id: "college_psyche_reputation",
                slot: "psyche",
                level: 3,
                public: false,
                title: "\u77E5\u6027\u58F0\u8A89\u6B7B\u7A74",
                text: "\u73CD\u89C6\u77E5\u6027\u5F97\u4F53\u5F62\u8C61\uFF0C\u754F\u60E7\u9690\u79D8\u79C1\u751F\u6D3B\u66DD\u5149\u6216\u6D41\u8A00\u871A\u8BED\u2014\u2014\u8FD9\u662F\u74E6\u89E3\u5176\u5FC3\u7406\u9632\u5907\u7684\u8981\u5BB3\u3002",
                place: null,
                reveal_via: [
                  "audit_class",
                  "chat"
                ]
              },
              {
                id: "target_romance_single_status",
                slot: "romance",
                level: 1,
                public: false,
                title: "\u72EC\u5C45\u5355\u8EAB",
                text: "\u5F53\u524D\u5904\u4E8E\u5355\u8EAB\u65E0\u4EA4\u5F80\u5BF9\u8C61\u72B6\u6001\uFF0C\u72EC\u6765\u72EC\u5F80\uFF0C\u4EAB\u53D7\u65E0\u62D8\u65E0\u675F\u7684\u4E2A\u4EBA\u72EC\u7ACB\u751F\u6D3B\u3002",
                place: null,
                reveal_via: []
              },
              {
                id: "target_romance_single_boundary",
                slot: "romance",
                level: 2,
                public: false,
                title: "\u60C5\u611F\u7A7A\u767D",
                text: "\u5076\u5C14\u53D7\u5230\u540C\u7CFB\u7537\u751F\u7684\u8FFD\u6C42\u4F46\u4ECE\u672A\u677E\u53E3\u7B54\u5E94\uFF0C\u60C5\u611F\u7ECF\u5386\u7A7A\u767D\uFF0C\u5BF9\u604B\u7231\u62B1\u6301\u89C2\u671B\u6001\u5EA6\u3002",
                place: null,
                reveal_via: [
                  "hear_gossip",
                  "chat",
                  "watch_peers"
                ]
              },
              {
                id: "target_romance_single_core",
                slot: "romance",
                level: 3,
                public: false,
                title: "\u672A\u6D89\u60C5\u4E8B",
                text: "\u59CB\u7EC8\u4FDD\u6301\u7740\u672A\u66FE\u6D89\u8DB3\u7537\u5973\u60C5\u4E8B\u7684\u7EAF\u6D01\u8EAB\u5FC3\uFF0C\u4ECE\u672A\u4F53\u9A8C\u8FC7\u5F02\u6027\u7684\u89E6\u78B0\uFF0C\u8EAB\u4F53\u5904\u4E8E\u672A\u88AB\u5F00\u53D1\u72B6\u6001\u3002",
                place: null,
                reveal_via: [
                  "hear_gossip",
                  "pump_person",
                  "audit_class"
                ]
              }
            ],
            homePool: [
              {
                id: "home_alley_redbrick",
                name: "\u6DF1\u5DF7\u7EA2\u7816\u516C\u5BD3",
                facts: [
                  {
                    id: "college_home_area",
                    slot: "home",
                    level: 1,
                    public: false,
                    title: "\u79DF\u4F4F\u7247\u533A",
                    text: "\u72EC\u5C45\u5728\u8001\u57CE\u6587\u6559\u533A\u8FB9\u7F18\u7684\u8001\u5F0F\u5F04\u5802\u5185\uFF0C\u8DDD\u79BB\u5927\u5B66\u6B63\u95E8\u6B65\u884C\u7EA6\u5341\u4E94\u5206\u949F\u8DEF\u7A0B\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "college_home_building",
                    slot: "home",
                    level: 2,
                    public: false,
                    title: "\u4F4F\u5904\u697C\u680B",
                    text: "\u79DF\u4F4F\u5728\u8001\u65E7\u7EA2\u7816\u4F4F\u5B85\u697C\u4E09\u5C42\uFF0C\u5F04\u5802\u8FC7\u9053\u672A\u8BBE\u8DEF\u706F\uFF0C\u697C\u9053\u5916\u5899\u722C\u7740\u67AF\u85E4\u4E0E\u8001\u5316\u6392\u6C34\u7BA1\u3002",
                    place: "unit_stairs_b",
                    reveal_via: [
                      "follow",
                      "stakeout"
                    ]
                  },
                  {
                    id: "college_home_door",
                    slot: "home",
                    level: 3,
                    public: false,
                    title: "\u95E8\u724C\u4E0E\u9501\u5177",
                    text: "\u95E8\u724C302\uFF0C\u8001\u5F0F\u53CC\u6392\u5F39\u5B50\u9501\uFF0C\u95E8\u6846\u4E0A\u65B9\u8D34\u7740\u5916\u5356\u9632\u7AA5\u8D34\u7EB8\uFF0C\u95E8\u57AB\u4E0B\u672A\u85CF\u5907\u7528\u94A5\u5319\u3002",
                    place: "unit_stairs_b",
                    reveal_via: [
                      "ransack",
                      "door_peep",
                      "try_handle"
                    ]
                  }
                ]
              },
              {
                id: "home_street_apartment",
                name: "\u4E34\u8857\u5546\u4F4F\u5C0F\u516C\u5BD3",
                facts: [
                  {
                    id: "college_home_street_area",
                    slot: "home",
                    level: 1,
                    public: false,
                    title: "\u4E34\u8857\u4F4F\u5904",
                    text: "\u79DF\u4F4F\u5728\u5546\u4E1A\u8857\u4E0E\u8001\u8857\u4EA4\u6C47\u5904\u7684\u4E34\u8857\u5546\u4F4F\u697C\uFF0C\u697C\u4E0B\u55A7\u95F9\uFF0C\u4E0B\u697C\u4FBF\u662F\u5FEB\u9910\u5E97\u4E0E\u4FBF\u5229\u5E97\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "college_home_street_corridor",
                    slot: "home",
                    level: 2,
                    public: false,
                    title: "\u8D70\u5ECA\u5916\u5ECA",
                    text: "\u4F4F\u5728\u4E34\u8857\u5546\u4F4F\u697C\u4E94\u697C\u5355\u95F4\uFF0C\u7535\u68AF\u8001\u65E7\u9700\u8981\u5237\u5361\uFF0C\u5916\u6302\u7A7A\u8C03\u673A\u5E38\u5E74\u6EF4\u6C34\u5728\u6C34\u6CE5\u96E8\u68DA\u4E0A\u3002",
                    place: "unit_stairs_b",
                    reveal_via: [
                      "follow",
                      "stakeout"
                    ]
                  },
                  {
                    id: "college_home_street_lock",
                    slot: "home",
                    level: 3,
                    public: false,
                    title: "\u5BC6\u7801\u9501\u4E0E\u732B\u773C",
                    text: "\u95E8\u724C506\uFF0C\u88C5\u4E86\u7535\u5B50\u5BC6\u7801\u9501\u5E76\u8D34\u6709\u732B\u773C\u9632\u7AA5\u76D6\uFF0C\u94A5\u5319\u6263\u4E0A\u6302\u7740\u5E26\u5361\u5957\u7684\u95E8\u7981IC\u5361\u3002",
                    place: "unit_stairs_b",
                    reveal_via: [
                      "ransack",
                      "door_peep",
                      "locate"
                    ]
                  }
                ]
              },
              {
                id: "home_rooftop_loft",
                name: "\u9876\u5C42\u79C1\u5BC6\u9601\u697C",
                facts: [
                  {
                    id: "college_home_loft_area",
                    slot: "home",
                    level: 1,
                    public: false,
                    title: "\u9876\u5C42\u81EA\u5EFA\u623F",
                    text: "\u79DF\u4F4F\u5728\u57CE\u4E2D\u6751\u6DF1\u5904\u7684\u81EA\u5EFA\u6C11\u623F\u9876\u5C42\uFF0C\u51FA\u5165\u8981\u7ECF\u8FC7\u4E00\u6BB5\u72ED\u7A84\u660F\u6697\u7684\u94C1\u76AE\u6276\u68AF\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "college_home_loft_roof",
                    slot: "home",
                    level: 2,
                    public: false,
                    title: "\u5929\u53F0\u5355\u95F4",
                    text: "\u81EA\u5EFA\u623F\u9876\u5C42\u52A0\u76D6\u7684\u72EC\u7ACB\u5355\u95F4\uFF0C\u667E\u8863\u67B6\u642D\u5728\u6C34\u6CE5\u5929\u53F0\uFF0C\u89C6\u91CE\u5F00\u9614\u4F46\u697C\u4E0B\u8FC7\u9053\u660F\u6697\u65E0\u706F\u3002",
                    place: "unit_stairs_b",
                    reveal_via: [
                      "follow",
                      "stakeout"
                    ]
                  },
                  {
                    id: "college_home_loft_door",
                    slot: "home",
                    level: 3,
                    public: false,
                    title: "\u9601\u697C\u6302\u9501",
                    text: "\u9876\u5C42\u72EC\u95E8601\uFF0C\u6302\u7740\u81EA\u8D2D\u7684\u4E0D\u9508\u94A2\u6302\u9501\u4E0E\u8001\u5F0F\u63D2\u9500\uFF0C\u7A97\u6237\u62C9\u7740\u539A\u91CD\u7684\u906E\u5149\u7A97\u5E18\u3002",
                    place: "unit_stairs_b",
                    reveal_via: [
                      "ransack",
                      "door_peep",
                      "try_handle"
                    ]
                  }
                ]
              }
            ],
            schedulePool: [
              {
                id: "sched_academic",
                name: "\u56FE\u4E66\u9986\u5907\u8003\u578B",
                preferredPersonalities: [
                  "stubborn",
                  "aloof",
                  "vigilant",
                  "introverted"
                ],
                facts: [
                  {
                    id: "college_sched_library",
                    slot: "schedule",
                    level: 1,
                    public: false,
                    title: "\u81EA\u4E60\u95ED\u9986\u65F6\u95F4",
                    text: "\u5E73\u65E5\u665A\u81EA\u4E60\u56FA\u5B9A\u572821:30\u79BB\u5F00\u56FE\u4E66\u9986\u95ED\u9986\u6B65\u51FA\u6821\u95E8\uFF0C\u6B65\u901F\u5300\u79F0\uFF0C\u4E60\u60EF\u4F4E\u5934\u770B\u624B\u673A\u3002",
                    place: "school_gate_b",
                    reveal_via: []
                  },
                  {
                    id: "college_sched_store",
                    slot: "schedule",
                    level: 2,
                    public: false,
                    title: "\u4FBF\u5229\u5E97\u505C\u6B65",
                    text: "\u5F52\u9014\u4E60\u60EF\u5728\u8001\u5929\u6865\u4E0B\u7684\u4FBF\u5229\u5E97\u77ED\u6682\u505C\u7559\u4E70\u6E29\u70ED\u5976\u54C1\uFF0C\u5468\u516D\u508D\u665A\u82E5\u4E0D\u51FA\u6E38\u5C31\u4F1A\u53BB\u81EA\u4E60\u5BA4\u5907\u8003\u3002",
                    place: "store_24h_b",
                    reveal_via: [
                      "follow",
                      "stakeout"
                    ]
                  },
                  {
                    id: "college_sched_ddl",
                    slot: "schedule",
                    level: 3,
                    public: false,
                    title: "\u4F5C\u4E1A\u7ED3\u8BFE\u5EF6\u8BEF",
                    text: "\u9047\u5B9E\u9A8C\u7ED3\u9898\u6216\u5927\u4F5C\u4E1A\u6C47\u62A5\uFF0C\u79BB\u6821\u65F6\u95F4\u5FC5\u5B9A\u63A8\u8FDF40\u5206\u949F\u81F322:10\uFF0C\u72EC\u81EA\u7A7F\u8FC7\u6DF1\u591C\u7A7A\u65F7\u6697\u5DF7\u3002",
                    place: "school_gate_b",
                    reveal_via: [
                      "ransack",
                      "pump_person",
                      "audit_class"
                    ]
                  }
                ]
              },
              {
                id: "sched_parttime",
                name: "\u52E4\u5DE5\u4FED\u5B66\u517C\u804C\u578B",
                preferredPersonalities: [
                  "gentle",
                  "stubborn",
                  "casual",
                  "naive"
                ],
                facts: [
                  {
                    id: "college_sched_parttime_shift",
                    slot: "schedule",
                    level: 1,
                    public: false,
                    title: "\u517C\u804C\u6253\u5361\u4E0B\u73ED",
                    text: "\u5468\u4E00\u81F3\u5468\u56DB\u5728\u6587\u6559\u533A\u5496\u5561\u5E97\u517C\u804C\u6253\u5DE5\u81F321:45\u6253\u5361\u4E0B\u73ED\uFF0C\u6362\u4E0B\u56F4\u88D9\u540E\u5306\u5306\u79BB\u5F00\u3002",
                    place: "school_gate_b",
                    reveal_via: []
                  },
                  {
                    id: "college_sched_parttime_snack",
                    slot: "schedule",
                    level: 2,
                    public: false,
                    title: "\u591C\u5BB5\u4E70\u5355\u6298\u8FD4",
                    text: "\u517C\u804C\u7ED3\u675F\u540E\u4E60\u60EF\u5728\u8001\u8857\u5C0F\u5403\u8857\u4E70\u4E00\u4EFD\u6253\u5305\u591C\u5BB5\uFF0C\u5468\u516D\u4E0B\u5348\u4E5F\u7ECF\u5E38\u53BB\u5E97\u91CC\u8F6E\u503C\u66FF\u73ED\u3002",
                    place: "store_24h_b",
                    reveal_via: [
                      "follow",
                      "stakeout"
                    ]
                  },
                  {
                    id: "college_sched_parttime_closing",
                    slot: "schedule",
                    level: 3,
                    public: false,
                    title: "\u6708\u672B\u76D8\u70B9\u6253\u70CA",
                    text: "\u6BCF\u9022\u6708\u672B\u6216\u5927\u4FC3\u524D\u591C\uFF0C\u5728\u5E97\u91CC\u76D8\u70B9\u8D27\u7269\u62D6\u5EF6\u81F322:20\u65B9\u624D\u4E0B\u73ED\uFF0C\u8EAB\u5FC3\u75B2\u60EB\u4E14\u53CC\u624B\u63D0\u7740\u91CD\u7269\u3002",
                    place: "school_gate_b",
                    reveal_via: [
                      "ransack",
                      "pump_person",
                      "audit_class"
                    ]
                  }
                ]
              },
              {
                id: "sched_socialite",
                name: "\u793E\u56E2\u793E\u4EA4\u6F2B\u6E38\u578B",
                preferredPersonalities: [
                  "cheerful",
                  "chic",
                  "naive",
                  "casual"
                ],
                facts: [
                  {
                    id: "college_sched_social_club",
                    slot: "schedule",
                    level: 1,
                    public: false,
                    title: "\u793E\u56E2\u6392\u7EC3\u6563\u573A",
                    text: "\u5E73\u65E5\u53C2\u52A0\u5B66\u751F\u793E\u56E2\u6392\u7EC3\uFF0C\u901A\u5E38\u572821:20\u5DE6\u53F3\u8D70\u51FA\u6D3B\u52A8\u4E2D\u5FC3\uFF0C\u4E0E\u793E\u5458\u8BF4\u8BF4\u7B11\u7B11\u8D70\u51FA\u6821\u95E8\u3002",
                    place: "school_gate_b",
                    reveal_via: []
                  },
                  {
                    id: "college_sched_social_friday",
                    slot: "schedule",
                    level: 2,
                    public: false,
                    title: "\u5468\u4E94\u5546\u5708\u5730\u94C1",
                    text: "\u5468\u4E94\u665A\u4E0A\u5E38\u4E0E\u540C\u4F34\u53BB\u5546\u5708\u805A\u9910\u901B\u8857\uFF0C21:40\u4E58\u5730\u94C1\u56DE\u8001\u8857\u7AD9\uFF0C\u624B\u91CC\u63D0\u7740\u6253\u5305\u7EB8\u888B\u4E0E\u5976\u8336\u3002",
                    place: "old_metro_b",
                    reveal_via: [
                      "follow",
                      "stakeout"
                    ]
                  },
                  {
                    id: "college_sched_social_parting",
                    slot: "schedule",
                    level: 3,
                    public: false,
                    title: "\u805A\u4F1A\u6563\u4F19\u843D\u5355",
                    text: "\u793E\u56E2\u805A\u4F1A\u6563\u573A\u540E\u7ECF\u5E38\u6709\u4EBA\u8D77\u54C4\u53BB\u7B2C\u4E8C\u644A\uFF0C\u82E5\u63A8\u8131\u4E0D\u53BB\u4FBF\u4F1A\u572822:15\u72EC\u81EA\u843D\u5355\u8D70\u56DE\u8001\u5DF7\u3002",
                    place: "school_gate_b",
                    reveal_via: [
                      "ransack",
                      "pump_person",
                      "audit_class"
                    ]
                  }
                ]
              }
            ],
            carryPool: [
              {
                id: "carry_academic",
                name: "\u5B9E\u7528\u539A\u5E06\u5E03\u5305",
                preferredPersonalities: [
                  "stubborn",
                  "aloof",
                  "vigilant",
                  "introverted",
                  "gentle"
                ],
                facts: [
                  {
                    id: "college_carry_bag",
                    slot: "carry",
                    level: 1,
                    public: true,
                    title: "\u968F\u8EAB\u5305\u888B",
                    text: "\u5355\u80A9\u7C73\u767D\u8272\u539A\u5E06\u5E03\u5305\uFF0C\u4FA7\u888B\u63D2\u7740\u6298\u53E0\u6674\u96E8\u4F1E\u4E0E\u4FDD\u6E29\u6C34\u676F\uFF0C\u8D70\u8DEF\u65F6\u4E60\u60EF\u5355\u624B\u62A4\u5728\u8EAB\u4FA7\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "college_carry_daily",
                    slot: "carry",
                    level: 2,
                    public: false,
                    title: "\u5305\u5185\u5E38\u5907\u7269",
                    text: "\u5E06\u5E03\u5305\u5185\u5E38\u5907\uFF1A\u6821\u56ED\u4E00\u5361\u901A\u3001\u964D\u566A\u8033\u9EA6\u76D2\u3001\u8367\u5149\u7B14\u4E0E\u8584\u8377\u6DA6\u5589\u7CD6\u3001\u51FA\u79DF\u5C4B\u94A5\u5319\u4E32\u3002",
                    place: null,
                    reveal_via: [
                      "photo",
                      "scan",
                      "listen",
                      "note"
                    ]
                  },
                  {
                    id: "college_carry_defense",
                    slot: "carry",
                    level: 3,
                    public: false,
                    title: "\u4FBF\u643A\u9632\u8EAB\u7269",
                    text: "\u5305\u5185\u6697\u683C\u5939\u5C42\u85CF\u7740\u4E00\u74F6\u5FAE\u578B\u9632\u72FC\u55B7\u96FE\u4E0E\u4E00\u628A\u5C0F\u5DE7\u7684\u7F8E\u5DE5\u88C1\u7EB8\u5200\uFF0C\u9632\u5907\u5FC3\u91CD\u4F46\u62FF\u53D6\u7565\u663E\u8FDF\u6EDE\u3002",
                    place: null,
                    reveal_via: [
                      "pick",
                      "ransack"
                    ]
                  }
                ]
              },
              {
                id: "carry_glamour",
                name: "\u7CBE\u81F4\u94FE\u6761\u76AE\u5305",
                preferredPersonalities: [
                  "chic",
                  "cheerful",
                  "naive"
                ],
                facts: [
                  {
                    id: "college_carry_glamour_bag",
                    slot: "carry",
                    level: 1,
                    public: true,
                    title: "\u7CBE\u81F4\u76AE\u5305",
                    text: "\u6D45\u674F\u8272\u76AE\u8D28\u5355\u80A9\u94FE\u6761\u5C0F\u5305\uFF0C\u6B3E\u5F0F\u7CBE\u81F4\u5C0F\u5DE7\uFF0C\u91D1\u5C5E\u94FE\u6761\u5728\u80A9\u5934\u968F\u7740\u6B65\u4F10\u8F7B\u5FAE\u649E\u51FB\u4F5C\u54CD\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "college_carry_glamour_daily",
                    slot: "carry",
                    level: 2,
                    public: false,
                    title: "\u8865\u5986\u7528\u54C1",
                    text: "\u5C0F\u5305\u5185\u585E\u5F97\u6EE1\u6EE1\u5F53\u5F53\uFF1A\u6C14\u57AB\u7C89\u997C\u3001\u53E3\u7EA2\u3001\u6298\u53E0\u68B3\u3001\u6E7F\u7EB8\u5DFE\u4E0E\u5E26\u6BDB\u7ED2\u6302\u5760\u7684\u624B\u673A\u3002",
                    place: null,
                    reveal_via: [
                      "photo",
                      "scan",
                      "listen",
                      "note"
                    ]
                  },
                  {
                    id: "college_carry_glamour_alarm",
                    slot: "carry",
                    level: 3,
                    public: false,
                    title: "\u8702\u9E23\u8B66\u62A5\u5668",
                    text: "\u94A5\u5319\u4E32\u4E0A\u6302\u7740\u4E00\u679A\u9AD8\u5206\u8D1D\u7C89\u8272\u8702\u9E23\u8B66\u62A5\u5668\uFF0C\u62D4\u6389\u63D2\u9500\u4F1A\u53D1\u51FA\u5C16\u9510\u8B66\u62A5\uFF0C\u4F46\u5E38\u88AB\u538B\u5728\u5305\u5E95\u4E0D\u6613\u6478\u51FA\u3002",
                    place: null,
                    reveal_via: [
                      "pick",
                      "ransack"
                    ]
                  }
                ]
              },
              {
                id: "carry_casual",
                name: "\u968F\u6027\u5C3C\u9F99\u659C\u630E\u5305",
                preferredPersonalities: [
                  "casual",
                  "timid",
                  "vigilant"
                ],
                facts: [
                  {
                    id: "college_carry_casual_bag",
                    slot: "carry",
                    level: 1,
                    public: true,
                    title: "\u8F7B\u4FBF\u659C\u630E\u5305",
                    text: "\u7EAF\u9ED1\u8F7B\u4FBF\u9632\u6CFC\u6C34\u5C3C\u9F99\u659C\u630E\u5305\uFF0C\u677E\u57AE\u630E\u5728\u80F8\u524D\u6216\u540E\u80CC\uFF0C\u53CC\u624B\u7ECF\u5E38\u63D2\u5728\u5916\u5957\u53E3\u888B\u91CC\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "college_carry_casual_daily",
                    slot: "carry",
                    level: 2,
                    public: false,
                    title: "\u6781\u7B80\u968F\u8EAB\u7269",
                    text: "\u659C\u630E\u5305\u5185\u53EA\u6709\u624B\u673A\u5145\u7535\u5B9D\u3001\u6570\u636E\u7EBF\u3001\u7EB8\u5DFE\u3001\u8584\u8377\u53E3\u9999\u7CD6\u4E0E\u96F6\u6563\u96F6\u94B1\uFF0C\u4E1C\u897F\u5F88\u5C11\u3002",
                    place: null,
                    reveal_via: [
                      "photo",
                      "scan",
                      "listen",
                      "note"
                    ]
                  },
                  {
                    id: "college_carry_casual_tracker",
                    slot: "carry",
                    level: 3,
                    public: false,
                    title: "\u84DD\u7259\u5BFB\u7269\u5668",
                    text: "\u94A5\u5319\u4E32\u4E0A\u6302\u7740\u84DD\u7259\u9632\u4E22\u5BFB\u627E\u5668\uFF0C\u8FDE\u7740\u624B\u673A\u9759\u9ED8\u62A5\u8B66\uFF0C\u4F46\u5E38\u5E38\u5FD8\u8BB0\u6253\u5F00\u624B\u673A\u84DD\u7259\u3002",
                    place: null,
                    reveal_via: [
                      "pick",
                      "ransack"
                    ]
                  }
                ]
              }
            ],
            socialPool: [
              {
                id: "social_introvert",
                name: "\u5B64\u50FB\u72EC\u884C\u5C11\u8A00\u578B",
                preferredPersonalities: [
                  "introverted",
                  "aloof",
                  "vigilant",
                  "timid"
                ],
                facts: [
                  {
                    id: "college_social_circle",
                    slot: "social",
                    level: 1,
                    public: false,
                    title: "\u4EBA\u9645\u758F\u5BC6",
                    text: "\u5728\u8FD9\u5EA7\u57CE\u5E02\u6CA1\u6709\u4EB2\u5C5E\uFF0C\u4EBA\u9645\u5708\u76F8\u5BF9\u5C01\u95ED\uFF0C\u9664\u540C\u7CFB\u540C\u4E13\u4E1A\u540C\u5B66\u5916\u9C9C\u5C11\u4E0E\u5916\u754C\u6DF1\u5165\u6765\u5F80\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "college_social_roommate",
                    slot: "social",
                    level: 2,
                    public: false,
                    title: "\u7ED3\u4F34\u540C\u4F34",
                    text: "\u665A\u81EA\u4E60\u5076\u5C14\u4E0E\u77ED\u53D1\u540C\u7CFB\u5BA4\u53CB\u7ED3\u4F34\u8D70\u51FA\u6821\u95E8\uFF0C\u884C\u81F3\u5929\u6865\u5206\u5C94\u8DEF\u53E3\u544A\u522B\u540E\u5404\u81EA\u72EC\u884C\u3002",
                    place: "school_gate_b",
                    reveal_via: [
                      "watch_peers"
                    ]
                  },
                  {
                    id: "college_social_crush",
                    slot: "social",
                    level: 3,
                    public: false,
                    title: "\u66A7\u6627\u5FC3\u4E8B",
                    text: "\u4E0E\u540C\u7EC4\u505A\u9879\u76EE\u7684\u5B66\u957F\u4FDD\u6301\u7740\u82E5\u5373\u82E5\u79BB\u7684\u597D\u611F\uFF0C\u5468\u516D\u5076\u5C14\u53D7\u9080\u770B\u5C55\uFF0C\u4F46\u8981\u5F3A\u7684\u81EA\u5C0A\u5FC3\u8BA9\u5979\u4ECE\u672A\u4E3B\u52A8\u8868\u767D\u3002",
                    place: null,
                    reveal_via: [
                      "hear_gossip",
                      "pump_person",
                      "audit_class"
                    ]
                  }
                ]
              },
              {
                id: "social_extrovert",
                name: "\u6D3B\u8DC3\u805A\u96C6\u7FA4\u4F53\u578B",
                preferredPersonalities: [
                  "cheerful",
                  "chic",
                  "naive"
                ],
                facts: [
                  {
                    id: "college_social_extrovert_circle",
                    slot: "social",
                    level: 1,
                    public: false,
                    title: "\u6D3B\u8DC3\u793E\u4EA4\u5708",
                    text: "\u6027\u683C\u5916\u5411\u6D3B\u6CFC\uFF0C\u5728\u6821\u5185\u8BA4\u8BC6\u5F88\u591A\u4E0D\u540C\u9662\u7CFB\u7684\u670B\u53CB\uFF0C\u7ECF\u5E38\u5728\u793E\u4EA4\u5E73\u53F0\u53D1\u5E03\u805A\u9910\u52A8\u6001\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "college_social_extrovert_friends",
                    slot: "social",
                    level: 2,
                    public: false,
                    title: "\u95FA\u871C\u540C\u884C",
                    text: "\u7ECF\u5E38\u6709\u4E24\u4E09\u4E2A\u95FA\u871C\u6216\u793E\u56E2\u670B\u53CB\u7ED3\u4F34\u540C\u884C\u81F3\u8001\u8857\u8DEF\u53E3\uFF0C\u5206\u522B\u65F6\u603B\u8981\u5728\u8DEF\u706F\u4E0B\u4F9D\u4F9D\u4E0D\u820D\u804A\u4E0A\u597D\u4E00\u9635\u3002",
                    place: "school_gate_b",
                    reveal_via: [
                      "watch_peers"
                    ]
                  },
                  {
                    id: "college_social_extrovert_repute",
                    slot: "social",
                    level: 3,
                    public: false,
                    title: "\u7FA4\u4F53\u8BA4\u540C\u611F",
                    text: "\u683C\u5916\u5728\u4E4E\u670B\u53CB\u5708\u4EBA\u7F18\u4E0E\u8BC4\u4EF7\uFF0C\u751F\u6015\u81EA\u5DF1\u5728\u4EBA\u524D\u5931\u6001\u4E22\u8138\uFF0C\u7FA4\u4F53\u8BA4\u540C\u611F\u662F\u5176\u5FC3\u7406\u951A\u70B9\u3002",
                    place: null,
                    reveal_via: [
                      "hear_gossip",
                      "pump_person",
                      "audit_class"
                    ]
                  }
                ]
              },
              {
                id: "social_moderate",
                name: "\u6E29\u548C\u9002\u5EA6\u77E5\u5DF1\u578B",
                preferredPersonalities: [
                  "gentle",
                  "stubborn",
                  "casual"
                ],
                facts: [
                  {
                    id: "college_social_moderate_circle",
                    slot: "social",
                    level: 1,
                    public: false,
                    title: "\u77E5\u5DF1\u4E24\u4E09",
                    text: "\u793E\u4EA4\u5708\u9002\u5EA6\uFF0C\u5F85\u4EBA\u6E29\u548C\u5BA2\u6C14\u4F46\u6709\u5206\u5BF8\u611F\uFF0C\u53EA\u4E0E\u4E00\u4E24\u540D\u6027\u683C\u76F8\u6295\u7684\u95FA\u871C\u4FDD\u6301\u77E5\u5FC3\u5173\u7CFB\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "college_social_clerk",
                    slot: "social",
                    level: 2,
                    public: false,
                    title: "\u4FBF\u5229\u5E97\u719F\u9762\u5B54",
                    text: "\u8001\u8857\u4FBF\u5229\u5E97\u591C\u73ED\u5E97\u5458\u8BA4\u5F97\u5979\uFF0C\u7ED3\u8D26\u65F6\u5076\u5C14\u5BD2\u6684\u4E24\u53E5\uFF0C\u662F\u5F52\u9014\u4E2D\u552F\u4E00\u80FD\u8BF4\u4E0A\u8BDD\u7684\u8857\u9762\u719F\u4EBA\u3002",
                    place: "store_24h_b",
                    reveal_via: [
                      "watch_peers",
                      "pump_person"
                    ]
                  },
                  {
                    id: "college_social_moderate_confidant",
                    slot: "social",
                    level: 3,
                    public: false,
                    title: "\u79C1\u5BC6\u503E\u8BC9",
                    text: "\u5076\u5C14\u4E0E\u77E5\u5FC3\u95FA\u871C\u8BED\u97F3\u503E\u8BC9\u5FC3\u4E8B\uFF0C\u5FC3\u4E2D\u7684\u70E6\u607C\u4E0E\u8106\u5F31\u53EA\u5411\u6781\u5C11\u6570\u8BA4\u53EF\u7684\u4EBA\u503E\u5410\u3002",
                    place: null,
                    reveal_via: [
                      "hear_gossip",
                      "pump_person",
                      "audit_class"
                    ]
                  }
                ]
              }
            ],
            psychePool: [
              {
                id: "psyche_pride",
                name: "\u8981\u5F3A\u81EA\u5C0A\u786C\u6491\u578B",
                preferredPersonalities: [
                  "stubborn",
                  "aloof",
                  "vigilant"
                ],
                facts: [
                  {
                    id: "college_psyche_facade_l1",
                    slot: "psyche",
                    level: 1,
                    public: false,
                    title: "\u81EA\u5C0A\u77DC\u6301",
                    text: "\u795E\u60C5\u81EA\u77DC\uFF0C\u81EA\u5C0A\u5FC3\u8981\u5F3A\uFF0C\u7EDD\u4E0D\u8F7B\u6613\u5728\u751F\u4EBA\u9762\u524D\u793A\u5F31\u9732\u51FA\u614C\u5F20\u795E\u6001\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "college_psyche_facade_l2",
                    slot: "psyche",
                    level: 2,
                    public: false,
                    title: "\u786C\u6491\u5FEB\u8D70",
                    text: "\u6DF1\u591C\u906D\u9047\u5F02\u6837\u76EE\u5149\u6216\u7D27\u903C\u65F6\uFF0C\u4F1A\u6B7B\u6B7B\u54AC\u4F4F\u4E0B\u5507\u52A0\u5FEB\u6B65\u4F10\u786C\u6491\uFF0C\u7EDD\u4E0D\u4E3B\u52A8\u6C42\u9976\u547C\u6551\u3002",
                    place: null,
                    reveal_via: [
                      "greet",
                      "chat"
                    ]
                  },
                  {
                    id: "college_psyche_reputation",
                    slot: "psyche",
                    level: 3,
                    public: false,
                    title: "\u77E5\u6027\u58F0\u8A89\u6B7B\u7A74",
                    text: "\u73CD\u89C6\u77E5\u6027\u5F97\u4F53\u5F62\u8C61\uFF0C\u754F\u60E7\u9690\u79D8\u79C1\u751F\u6D3B\u66DD\u5149\u6216\u6D41\u8A00\u871A\u8BED\u2014\u2014\u8FD9\u662F\u74E6\u89E3\u5176\u5FC3\u7406\u9632\u5907\u7684\u8981\u5BB3\u3002",
                    place: null,
                    reveal_via: [
                      "audit_class",
                      "chat"
                    ]
                  }
                ]
              },
              {
                id: "psyche_timid",
                name: "\u6E29\u8F6F\u80C6\u602F\u60E7\u9ED1\u578B",
                preferredPersonalities: [
                  "timid",
                  "gentle",
                  "naive"
                ],
                facts: [
                  {
                    id: "college_psyche_timid_l1",
                    slot: "psyche",
                    level: 1,
                    public: false,
                    title: "\u60E7\u9ED1\u6015\u51B7",
                    text: "\u80C6\u5C0F\u6015\u9ED1\uFF0C\u8D70\u5165\u660F\u6697\u65E0\u706F\u7684\u8001\u5F04\u5802\u65F6\u795E\u7ECF\u7D27\u7EF7\uFF0C\u98CE\u5439\u6811\u53F6\u7684\u58F0\u54CD\u90FD\u4F1A\u8BA9\u5979\u811A\u6B65\u4E00\u987F\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "college_psyche_timid_l2",
                    slot: "psyche",
                    level: 2,
                    public: false,
                    title: "\u614C\u4E71\u5931\u63AA",
                    text: "\u9762\u5BF9\u538B\u8FEB\u5BB9\u6613\u614C\u4E71\u5931\u63AA\uFF0C\u53CC\u624B\u7D27\u6525\u80CC\u5305\u5E26\u3001\u547C\u5438\u6025\u4FC3\uFF0C\u773C\u7736\u53D1\u7EA2\u51E0\u4E4E\u4E0D\u6562\u53CD\u6297\u3002",
                    place: null,
                    reveal_via: [
                      "greet",
                      "chat"
                    ]
                  },
                  {
                    id: "college_psyche_timid_l3",
                    slot: "psyche",
                    level: 3,
                    public: false,
                    title: "\u610F\u5FD7\u53D7\u63A7",
                    text: "\u4E00\u65E6\u5FC3\u7406\u9632\u7EBF\u88AB\u903C\u9000\uFF0C\u5BB9\u6613\u9677\u5165\u65E0\u52A9\u4E0E\u552F\u8BFA\uFF0C\u62B5\u6297\u610F\u5FD7\u8F83\u4E3A\u8584\u5F31\u3002",
                    place: null,
                    reveal_via: [
                      "audit_class",
                      "chat"
                    ]
                  }
                ]
              },
              {
                id: "psyche_cautious",
                name: "\u654F\u611F\u6212\u5907\u591A\u7591\u578B",
                preferredPersonalities: [
                  "vigilant",
                  "casual",
                  "introverted",
                  "chic"
                ],
                facts: [
                  {
                    id: "college_psyche_cautious_l1",
                    slot: "psyche",
                    level: 1,
                    public: false,
                    title: "\u8B66\u89C9\u591A\u7591",
                    text: "\u5BF9\u5468\u56F4\u73AF\u5883\u62B1\u6709\u5929\u7136\u7684\u4E0D\u4FE1\u4EFB\u611F\uFF0C\u7A7F\u8FC7\u8F6C\u89D2\u6216\u4EBA\u5C11\u5904\u4E60\u60EF\u501F\u52A9\u53CD\u5149\u73BB\u7483\u6697\u4E2D\u89C2\u5BDF\u8EAB\u540E\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "college_psyche_cautious_l2",
                    slot: "psyche",
                    level: 2,
                    public: false,
                    title: "\u679C\u65AD\u53D8\u5411",
                    text: "\u5BDF\u89C9\u5F02\u6837\u4F1A\u679C\u65AD\u53D8\u5411\u5FEB\u8D70\uFF0C\u8BD5\u56FE\u501F\u52A9\u4FBF\u5229\u5E97\u6216\u8857\u89D2\u8DEF\u706F\u7529\u8131\uFF0C\u9632\u5907\u5FC3\u7406\u8F83\u5F3A\u3002",
                    place: null,
                    reveal_via: [
                      "greet",
                      "chat"
                    ]
                  },
                  {
                    id: "college_psyche_cautious_l3",
                    slot: "psyche",
                    level: 3,
                    public: false,
                    title: "\u6050\u614C\u5931\u8861",
                    text: "\u4E00\u65E6\u53D1\u73B0\u81EA\u5DF1\u7684\u6212\u5907\u4E0E\u7B97\u76D8\u5168\u88AB\u8BC6\u7834\uFF0C\u591A\u7591\u53CD\u4F1A\u5316\u4F5C\u65E0\u63AA\u7684\u6050\u614C\uFF0C\u5FC3\u7406\u9632\u7EBF\u8FC5\u901F\u74E6\u89E3\u3002",
                    place: null,
                    reveal_via: [
                      "audit_class",
                      "chat"
                    ]
                  }
                ]
              }
            ],
            romancePool: [
              {
                id: "virgin_in_love",
                name: "\u6709\u604B\u4EBA \u672A\u53D1\u751F\u5173\u7CFB \u5904\u5973",
                facts: [
                  {
                    id: "target_romance_virgin_status",
                    slot: "romance",
                    level: 1,
                    public: false,
                    title: "\u521D\u604B\u4EA4\u5F80",
                    text: "\u6B63\u5728\u4E0E\u540C\u6821\u7537\u751F\u4EA4\u5F80\uFF0C\u6B63\u5904\u4E8E\u521D\u604B\u671F\uFF0C\u5C1A\u672A\u53D1\u751F\u8FC7\u903E\u77E9\u7684\u4EB2\u5BC6\u8EAB\u4F53\u5173\u7CFB\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "target_romance_virgin_boundary",
                    slot: "romance",
                    level: 2,
                    public: false,
                    title: "\u7EAF\u60C5\u5E95\u7EBF",
                    text: "\u5468\u672B\u7EA6\u4F1A\u4EC5\u6B62\u4E8E\u7275\u624B\u4E0E\u5E76\u80A9\u6563\u6B65\uFF0C\u9762\u5BF9\u7537\u751F\u7684\u66F4\u8FDB\u4E00\u6B65\u8BD5\u63A2\u4F1A\u7F9E\u6DA9\u63A8\u62D2\uFF0C\u575A\u5B88\u6700\u540E\u4E00\u9053\u5E95\u7EBF\u3002",
                    place: null,
                    reveal_via: [
                      "hear_gossip",
                      "chat",
                      "watch_peers"
                    ]
                  },
                  {
                    id: "target_romance_virgin_core",
                    slot: "romance",
                    level: 3,
                    public: false,
                    title: "\u5904\u5B50\u4E4B\u8EAB",
                    text: "\u4ECD\u4FDD\u6709\u5B8C\u6574\u7684\u5904\u5973\u4E4B\u8EAB\uFF0C\u5BF9\u521D\u6B21\u7684\u4F53\u9A8C\u6000\u7740\u7F9E\u6DA9\u800C\u8C28\u614E\u7684\u73CD\u89C6\uFF0C\u89C6\u8EAB\u4F53\u7EAF\u6D01\u4E3A\u81EA\u8EAB\u5E95\u7EBF\u3002",
                    place: null,
                    reveal_via: [
                      "hear_gossip",
                      "pump_person",
                      "audit_class"
                    ]
                  }
                ]
              },
              {
                id: "experienced_in_love",
                name: "\u6709\u604B\u4EBA \u5DF2\u53D1\u751F\u5173\u7CFB",
                facts: [
                  {
                    id: "target_romance_exp_status",
                    slot: "romance",
                    level: 1,
                    public: false,
                    title: "\u4EB2\u5BC6\u4EA4\u5F80",
                    text: "\u4E0E\u540C\u6821\u7537\u751F\u7A33\u5B9A\u4EA4\u5F80\u4E2D\uFF0C\u4E24\u4EBA\u611F\u60C5\u6DF1\u539A\uFF0C\u5DF2\u6709\u8FC7\u5B9E\u8D28\u6027\u7684\u7537\u5973\u4EB2\u5BC6\u63A5\u89E6\u7ECF\u9A8C\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "target_romance_exp_boundary",
                    slot: "romance",
                    level: 2,
                    public: false,
                    title: "\u8FC7\u591C\u75D5\u8FF9",
                    text: "\u5468\u516D\u7EA6\u4F1A\u65F6\u5076\u5C14\u4F1A\u5728\u60C5\u4FA3\u65C5\u793E\u6216\u5BF9\u65B9\u51FA\u79DF\u5C4B\u8FC7\u591C\uFF0C\u9888\u4FA7\u6216\u9501\u9AA8\u95F4\u5076\u5C14\u9690\u7EA6\u7559\u6709\u6D45\u6DE1\u543B\u75D5\u3002",
                    place: null,
                    reveal_via: [
                      "hear_gossip",
                      "chat",
                      "watch_peers"
                    ]
                  },
                  {
                    id: "target_romance_exp_core",
                    slot: "romance",
                    level: 3,
                    public: false,
                    title: "\u8EAB\u4F53\u7ECF\u9A8C",
                    text: "\u867D\u5DF2\u975E\u5904\u5B50\u4E4B\u8EAB\uFF0C\u5BF9\u7537\u5973\u60C5\u4E8B\u5DF2\u6709\u5207\u5B9E\u8BA4\u77E5\uFF0C\u4F46\u5728\u5916\u4F9D\u7136\u4FDD\u6301\u7740\u77E5\u6027\u7AEF\u5E84\u7684\u5B66\u751F\u5F62\u8C61\u3002",
                    place: null,
                    reveal_via: [
                      "hear_gossip",
                      "pump_person",
                      "audit_class"
                    ]
                  }
                ]
              },
              {
                id: "single",
                name: "\u5355\u8EAB",
                facts: [
                  {
                    id: "target_romance_single_status",
                    slot: "romance",
                    level: 1,
                    public: false,
                    title: "\u72EC\u5C45\u5355\u8EAB",
                    text: "\u5F53\u524D\u5904\u4E8E\u5355\u8EAB\u65E0\u4EA4\u5F80\u5BF9\u8C61\u72B6\u6001\uFF0C\u72EC\u6765\u72EC\u5F80\uFF0C\u4EAB\u53D7\u65E0\u62D8\u65E0\u675F\u7684\u4E2A\u4EBA\u72EC\u7ACB\u751F\u6D3B\u3002",
                    place: null,
                    reveal_via: []
                  },
                  {
                    id: "target_romance_single_boundary",
                    slot: "romance",
                    level: 2,
                    public: false,
                    title: "\u60C5\u611F\u7A7A\u767D",
                    text: "\u5076\u5C14\u53D7\u5230\u540C\u7CFB\u7537\u751F\u7684\u8FFD\u6C42\u4F46\u4ECE\u672A\u677E\u53E3\u7B54\u5E94\uFF0C\u60C5\u611F\u7ECF\u5386\u7A7A\u767D\uFF0C\u5BF9\u604B\u7231\u62B1\u6301\u89C2\u671B\u6001\u5EA6\u3002",
                    place: null,
                    reveal_via: [
                      "hear_gossip",
                      "chat",
                      "watch_peers"
                    ]
                  },
                  {
                    id: "target_romance_single_core",
                    slot: "romance",
                    level: 3,
                    public: false,
                    title: "\u672A\u6D89\u60C5\u4E8B",
                    text: "\u59CB\u7EC8\u4FDD\u6301\u7740\u672A\u66FE\u6D89\u8DB3\u7537\u5973\u60C5\u4E8B\u7684\u7EAF\u6D01\u8EAB\u5FC3\uFF0C\u4ECE\u672A\u4F53\u9A8C\u8FC7\u5F02\u6027\u7684\u89E6\u78B0\uFF0C\u8EAB\u4F53\u5904\u4E8E\u672A\u88AB\u5F00\u53D1\u72B6\u6001\u3002",
                    place: null,
                    reveal_via: [
                      "hear_gossip",
                      "pump_person",
                      "audit_class"
                    ]
                  }
                ]
              }
            ]
          }
        }
      };
    }
  });

  // src/config/places.json
  var require_places = __commonJS({
    "src/config/places.json"(exports, module) {
      module.exports = {
        districts: {
          A: {
            id: "A",
            name: "\u4E2D\u57CECBD\u5546\u52A1\u533A",
            sectors: [
              "A-1",
              "A-2",
              "A-3"
            ],
            transit_ports: [
              "metro_hub_a",
              "bus_bay_a"
            ],
            audio_ambient: "assets/audio/ambient/zone_a_surface.ogg"
          },
          B: {
            id: "B",
            name: "\u8001\u57CE\u6587\u6559\u533A",
            sectors: [
              "B-1",
              "B-2",
              "B-3"
            ],
            transit_ports: [
              "school_bus_terminal_b",
              "old_metro_b"
            ],
            audio_ambient: "assets/audio/ambient/zone_b_street.ogg"
          },
          C: {
            id: "C",
            name: "\u4E34\u6C5F\u5A31\u4E50\u7EA2\u706F\u533A",
            sectors: [
              "C-1",
              "C-2",
              "C-3"
            ],
            transit_ports: [
              "dock_bus_stop_c",
              "bridge_head_c"
            ],
            audio_ambient: "assets/audio/ambient/zone_c_clubstreet.ogg"
          },
          D: {
            id: "D",
            name: "\u90CA\u91CE\u8C6A\u5B85\u533A",
            sectors: [
              "D-1",
              "D-2",
              "D-3"
            ],
            transit_ports: [
              "suburb_highway_d"
            ],
            audio_ambient: "assets/audio/ambient/zone_d_road.ogg"
          }
        },
        places: {
          office_lobby_a: {
            id: "office_lobby_a",
            district: "A",
            sector: "A-1",
            name: "\u5199\u5B57\u697C\u5927\u5802",
            light: "bright",
            crowd: "pulse",
            surveillance: "dense",
            cover: 0,
            indoor: true,
            strike_sealed: true,
            sanctuary: false,
            transit_port: false,
            exits: [
              "skybridge_a",
              "metro_hub_a",
              "parking_b2_a",
              "back_alley_a"
            ],
            spots: [
              "reception",
              "security_clock"
            ],
            audio_trigger: "footstep_marble",
            free_pass: [
              "guard"
            ]
          },
          parking_b2_a: {
            id: "parking_b2_a",
            district: "A",
            sector: "A-1",
            name: "\u5730\u4E0B\u8F66\u5E93B2",
            light: "dim",
            crowd: "low",
            surveillance: "dense",
            cover: 1,
            indoor: true,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "office_lobby_a",
              "trash_station_a"
            ],
            spots: [
              "pillar_hide",
              "tire_screech"
            ],
            audio_ambient: "assets/audio/ambient/zone_a_parking.ogg",
            free_pass: [
              "guard"
            ]
          },
          skybridge_a: {
            id: "skybridge_a",
            district: "A",
            sector: "A-2",
            name: "\u8DE8\u8857\u8FDE\u5ECA\u5929\u6865",
            light: "dim",
            crowd: "mid",
            surveillance: "low",
            cover: -2,
            indoor: true,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "office_lobby_a",
              "metro_hub_a",
              "bus_bay_a"
            ],
            spots: [
              "perch_watch"
            ]
          },
          metro_hub_a: {
            id: "metro_hub_a",
            district: "A",
            sector: "A-2",
            name: "\u5730\u94C1\u67A2\u7EBD\u51FA\u5165\u53E3",
            light: "bright",
            crowd: "pulse",
            surveillance: "dense",
            cover: 0,
            indoor: true,
            strike_sealed: true,
            sanctuary: true,
            transit_port: true,
            exits: [
              "office_lobby_a",
              "skybridge_a",
              "store_24h_a",
              "bus_bay_a"
            ],
            spots: [
              "ticket_gate",
              "sunken_plaza"
            ]
          },
          bus_bay_a: {
            id: "bus_bay_a",
            district: "A",
            sector: "A-2",
            name: "\u7AD9\u524D\u516C\u4EA4\u6E2F\u6E7E",
            light: "dim",
            crowd: "mid",
            surveillance: "low",
            cover: 0,
            indoor: false,
            strike_sealed: true,
            sanctuary: false,
            transit_port: true,
            exits: [
              "metro_hub_a",
              "skybridge_a"
            ],
            spots: [
              "bus_wait"
            ]
          },
          store_24h_a: {
            id: "store_24h_a",
            district: "A",
            sector: "A-1",
            name: "\u6CBF\u885724h\u4FBF\u5229\u5E97",
            light: "bright",
            crowd: "mid",
            surveillance: "mid",
            cover: 0,
            indoor: true,
            strike_sealed: true,
            sanctuary: true,
            transit_port: false,
            exits: [
              "metro_hub_a",
              "office_lobby_a"
            ],
            spots: [
              "window_watch",
              "exit_watch"
            ]
          },
          back_alley_a: {
            id: "back_alley_a",
            district: "A",
            sector: "A-3",
            name: "\u540E\u8857\u6392\u98CE\u6697\u5DF7",
            light: "dark",
            crowd: "none",
            surveillance: "low",
            cover: 2,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "office_lobby_a",
              "trash_station_a"
            ],
            spots: [
              "fan_mask",
              "ebike_hide"
            ]
          },
          trash_station_a: {
            id: "trash_station_a",
            district: "A",
            sector: "A-3",
            name: "\u5783\u573E\u88C5\u5378\u540E\u9053",
            light: "dark",
            crowd: "none",
            surveillance: "none",
            cover: 2,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "back_alley_a",
              "parking_b2_a"
            ],
            spots: [
              "trash_search"
            ]
          },
          school_gate_b: {
            id: "school_gate_b",
            district: "B",
            sector: "B-1",
            name: "\u5B66\u6821\u6B63\u95E8",
            light: "bright",
            crowd: "pulse",
            surveillance: "mid",
            cover: 0,
            indoor: false,
            strike_sealed: true,
            sanctuary: false,
            transit_port: false,
            exits: [
              "school_bus_terminal_b",
              "old_skybridge_b"
            ],
            spots: [
              "gate_watch",
              "rush_mask"
            ],
            free_pass: [
              "student"
            ]
          },
          school_bus_terminal_b: {
            id: "school_bus_terminal_b",
            district: "B",
            sector: "B-1",
            name: "\u5B66\u533A\u516C\u4EA4\u603B\u7AD9",
            light: "dim",
            crowd: "mid",
            surveillance: "low",
            cover: 0,
            indoor: false,
            strike_sealed: true,
            sanctuary: false,
            transit_port: true,
            exits: [
              "school_gate_b",
              "old_skybridge_b",
              "old_metro_b"
            ],
            spots: [
              "bus_wait"
            ],
            free_pass: [
              "student"
            ]
          },
          old_metro_b: {
            id: "old_metro_b",
            district: "B",
            sector: "B-2",
            name: "\u8001\u8857\u5730\u94C1\u7AD9",
            light: "bright",
            crowd: "pulse",
            surveillance: "dense",
            cover: 0,
            indoor: true,
            strike_sealed: true,
            sanctuary: true,
            transit_port: true,
            exits: [
              "school_bus_terminal_b",
              "old_skybridge_b",
              "store_24h_b"
            ],
            spots: [
              "ticket_gate"
            ]
          },
          old_skybridge_b: {
            id: "old_skybridge_b",
            district: "B",
            sector: "B-2",
            name: "\u8001\u6C34\u6CE5\u5929\u6865",
            light: "dim",
            crowd: "mid",
            surveillance: "low",
            cover: -2,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "school_gate_b",
              "school_bus_terminal_b",
              "store_24h_b",
              "old_park_b"
            ],
            spots: [
              "perch_watch"
            ]
          },
          store_24h_b: {
            id: "store_24h_b",
            district: "B",
            sector: "B-2",
            name: "\u8001\u885724h\u4FBF\u5229\u5E97",
            light: "bright",
            crowd: "mid",
            surveillance: "mid",
            cover: 0,
            indoor: true,
            strike_sealed: true,
            sanctuary: true,
            transit_port: false,
            exits: [
              "old_skybridge_b",
              "old_metro_b",
              "old_alley_main_b"
            ],
            spots: [
              "window_watch",
              "exit_watch"
            ]
          },
          old_park_b: {
            id: "old_park_b",
            district: "B",
            sector: "B-2",
            name: "\u8001\u5C45\u6C11\u516C\u56ED",
            light: "dark",
            crowd: "low",
            surveillance: "low",
            cover: 1,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "old_skybridge_b",
              "old_alley_main_b"
            ],
            spots: [
              "park_bench",
              "tree_hide"
            ]
          },
          old_alley_main_b: {
            id: "old_alley_main_b",
            district: "B",
            sector: "B-3",
            name: "\u8001\u8857\u4E3B\u5F04\u5802",
            light: "dim",
            crowd: "low",
            surveillance: "none",
            cover: 1,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "store_24h_b",
              "old_park_b",
              "dark_blind_alley_b",
              "dead_end_b",
              "love_hotel_b"
            ],
            spots: [
              "sodium_lamp",
              "corner_shadow"
            ]
          },
          dark_blind_alley_b: {
            id: "dark_blind_alley_b",
            district: "B",
            sector: "B-3",
            name: "\u5C45\u6C11\u6742\u7269\u6697\u5DF7",
            light: "dark",
            crowd: "none",
            surveillance: "none",
            cover: 2,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "old_alley_main_b",
              "unit_stairs_b"
            ],
            spots: [
              "trash_hide",
              "bike_hide"
            ]
          },
          dead_end_b: {
            id: "dead_end_b",
            district: "B",
            sector: "B-3",
            name: "\u76F2\u7AEF\u6B7B\u80E1\u540C",
            light: "dark",
            crowd: "none",
            surveillance: "none",
            cover: 2,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "old_alley_main_b",
              "love_hotel_b"
            ],
            spots: [
              "trap_corner"
            ]
          },
          love_hotel_b: {
            id: "love_hotel_b",
            district: "B",
            sector: "B-3",
            name: "\u8001\u57CE\u60C5\u4FA3\u65C5\u793E",
            light: "dim",
            crowd: "low",
            surveillance: "low",
            cover: 1,
            indoor: true,
            strike_sealed: true,
            sanctuary: false,
            transit_port: false,
            exits: [
              "old_alley_main_b",
              "dead_end_b"
            ],
            spots: [
              "hotel_neon_sign",
              "rain_canopy",
              "front_desk"
            ]
          },
          unit_stairs_b: {
            id: "unit_stairs_b",
            district: "B",
            sector: "B-3",
            name: "\u8001\u65E7\u5355\u5143\u697C\u9053",
            light: "dark",
            crowd: "none",
            surveillance: "none",
            cover: 1,
            indoor: true,
            strike_sealed: false,
            sanctuary: true,
            transit_port: false,
            exits: [
              "dark_blind_alley_b",
              "rooftop_b"
            ],
            spots: [
              "listen_home",
              "door_crack",
              "try_handle"
            ],
            free_pass: [
              "guard"
            ]
          },
          rooftop_b: {
            id: "rooftop_b",
            district: "B",
            sector: "B-3",
            name: "\u8001\u697C\u5929\u53F0",
            light: "dark",
            crowd: "none",
            surveillance: "none",
            cover: 0,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "unit_stairs_b"
            ],
            spots: [
              "perch_watch",
              "climb_point"
            ]
          },
          club_backdoor_c: {
            id: "club_backdoor_c",
            district: "C",
            sector: "C-1",
            name: "\u9152\u5427\u5458\u5DE5\u540E\u95E8",
            light: "dim",
            crowd: "low",
            surveillance: "low",
            cover: 1,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "food_street_c",
              "river_walk_c"
            ],
            spots: [
              "drunk_exit"
            ],
            free_pass: [
              "bartender"
            ]
          },
          food_street_c: {
            id: "food_street_c",
            district: "C",
            sector: "C-1",
            name: "\u5927\u6392\u6863\u591C\u5E02\u8857\u89D2",
            light: "bright",
            crowd: "high",
            surveillance: "low",
            cover: 0,
            indoor: false,
            strike_sealed: true,
            sanctuary: false,
            transit_port: false,
            exits: [
              "club_backdoor_c",
              "store_24h_c",
              "dock_bus_stop_c"
            ],
            spots: [
              "carpool_stand"
            ],
            free_pass: [
              "bartender"
            ]
          },
          dock_bus_stop_c: {
            id: "dock_bus_stop_c",
            district: "C",
            sector: "C-1",
            name: "\u6CBF\u6C5F\u7801\u5934\u516C\u4EA4\u7AD9",
            light: "dim",
            crowd: "low",
            surveillance: "low",
            cover: 0,
            indoor: false,
            strike_sealed: true,
            sanctuary: false,
            transit_port: true,
            exits: [
              "food_street_c",
              "bridge_head_c"
            ],
            spots: [
              "bus_wait"
            ]
          },
          bridge_head_c: {
            id: "bridge_head_c",
            district: "C",
            sector: "C-1",
            name: "\u8DE8\u6C5F\u5927\u6865\u5934",
            light: "bright",
            crowd: "mid",
            surveillance: "mid",
            cover: 0,
            indoor: false,
            strike_sealed: true,
            sanctuary: false,
            transit_port: true,
            exits: [
              "dock_bus_stop_c",
              "river_walk_c"
            ],
            spots: [
              "bridge_view"
            ]
          },
          store_24h_c: {
            id: "store_24h_c",
            district: "C",
            sector: "C-1",
            name: "24h\u6CBF\u6C5F\u4FBF\u5229\u5E97",
            light: "bright",
            crowd: "mid",
            surveillance: "mid",
            cover: 0,
            indoor: true,
            strike_sealed: true,
            sanctuary: true,
            transit_port: false,
            exits: [
              "food_street_c",
              "village_main_c"
            ],
            spots: [
              "window_watch",
              "hangover_cure"
            ]
          },
          river_walk_c: {
            id: "river_walk_c",
            district: "C",
            sector: "C-2",
            name: "\u6C5F\u5824\u89C2\u666F\u957F\u6B65\u9053",
            light: "dark",
            crowd: "low",
            surveillance: "none",
            cover: 1,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "club_backdoor_c",
              "river_steps_c",
              "bridge_head_c"
            ],
            spots: [
              "river_rail",
              "sober_walk"
            ]
          },
          river_steps_c: {
            id: "river_steps_c",
            district: "C",
            sector: "C-2",
            name: "\u4EB2\u6C34\u907F\u98CE\u53F0\u9636",
            light: "dark",
            crowd: "none",
            surveillance: "none",
            cover: 2,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "river_walk_c",
              "village_main_c"
            ],
            spots: [
              "vomit_point",
              "reed_hide"
            ]
          },
          village_main_c: {
            id: "village_main_c",
            district: "C",
            sector: "C-3",
            name: "\u57CE\u4E2D\u6751\u63E1\u624B\u697C\u4E3B\u5F04",
            light: "dim",
            crowd: "low",
            surveillance: "none",
            cover: 1,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "store_24h_c",
              "river_steps_c",
              "narrow_gap_c"
            ],
            spots: [
              "wet_pavement"
            ]
          },
          narrow_gap_c: {
            id: "narrow_gap_c",
            district: "C",
            sector: "C-3",
            name: "\u4E00\u7EBF\u5929\u5E7D\u6E7F\u7A84\u5F04",
            light: "dark",
            crowd: "none",
            surveillance: "none",
            cover: 2,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "village_main_c",
              "rental_iron_door_c"
            ],
            spots: [
              "aircon_drip",
              "ambush_corner"
            ]
          },
          rental_iron_door_c: {
            id: "rental_iron_door_c",
            district: "C",
            sector: "C-3",
            name: "\u51FA\u79DF\u5C4B\u697C\u9053\u94C1\u95E8",
            light: "dark",
            crowd: "none",
            surveillance: "none",
            cover: 1,
            indoor: true,
            strike_sealed: false,
            sanctuary: true,
            transit_port: false,
            exits: [
              "narrow_gap_c",
              "village_roof_c"
            ],
            spots: [
              "spiral_stairs",
              "listen_home"
            ]
          },
          village_roof_c: {
            id: "village_roof_c",
            district: "C",
            sector: "C-3",
            name: "\u5171\u7528\u6742\u7269\u5929\u53F0",
            light: "dark",
            crowd: "none",
            surveillance: "none",
            cover: 1,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "rental_iron_door_c"
            ],
            spots: [
              "clothesline_hide",
              "overlook"
            ]
          },
          suburb_highway_d: {
            id: "suburb_highway_d",
            district: "D",
            sector: "D-1",
            name: "\u90CA\u91CE\u516C\u8DEF\u957F\u5F2F\u9053",
            light: "dark",
            crowd: "none",
            surveillance: "none",
            cover: 0,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: true,
            exits: [
              "gas_station_d",
              "private_road_d"
            ],
            spots: [
              "curve_hide"
            ]
          },
          gas_station_d: {
            id: "gas_station_d",
            district: "D",
            sector: "D-1",
            name: "24h\u516C\u8DEF\u52A0\u6CB9\u7AD9",
            light: "bright",
            crowd: "low",
            surveillance: "dense",
            cover: 0,
            indoor: true,
            strike_sealed: true,
            sanctuary: true,
            transit_port: false,
            exits: [
              "suburb_highway_d",
              "private_road_d"
            ],
            spots: [
              "mart_cashier",
              "pump_island"
            ]
          },
          private_road_d: {
            id: "private_road_d",
            district: "D",
            sector: "D-2",
            name: "\u6797\u836B\u79C1\u5BB6\u4E3B\u8F66\u9053",
            light: "dark",
            crowd: "none",
            surveillance: "none",
            cover: -2,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "suburb_highway_d",
              "gas_station_d",
              "pine_forest_d",
              "estate_gate_d"
            ],
            spots: [
              "open_road",
              "patrol_watch"
            ]
          },
          pine_forest_d: {
            id: "pine_forest_d",
            district: "D",
            sector: "D-2",
            name: "\u7F13\u5761\u6749\u6728\u5BC6\u6797",
            light: "dark",
            crowd: "none",
            surveillance: "none",
            cover: 3,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "private_road_d",
              "estate_gate_d"
            ],
            spots: [
              "ebike_cache",
              "tree_ambush"
            ]
          },
          estate_gate_d: {
            id: "estate_gate_d",
            district: "D",
            sector: "D-3",
            name: "\u5E84\u56ED\u94C1\u827A\u5927\u95E8",
            light: "dim",
            crowd: "none",
            surveillance: "dense",
            cover: 0,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "private_road_d",
              "pine_forest_d",
              "villa_garden_d"
            ],
            spots: [
              "gate_intercom",
              "infrared_cam"
            ]
          },
          villa_garden_d: {
            id: "villa_garden_d",
            district: "D",
            sector: "D-3",
            name: "\u79C1\u5BB6\u5EAD\u9662\u7EFF\u7BF1",
            light: "dark",
            crowd: "none",
            surveillance: "dense",
            cover: 2,
            indoor: false,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "estate_gate_d",
              "garage_side_door_d",
              "villa_porch_d"
            ],
            spots: [
              "dog_kennel",
              "sprinkler"
            ]
          },
          garage_side_door_d: {
            id: "garage_side_door_d",
            district: "D",
            sector: "D-3",
            name: "\u8F66\u5E93\u5165\u6237\u4FA7\u95E8",
            light: "dark",
            crowd: "none",
            surveillance: "none",
            cover: 1,
            indoor: true,
            strike_sealed: false,
            sanctuary: false,
            transit_port: false,
            exits: [
              "villa_garden_d",
              "villa_porch_d"
            ],
            spots: [
              "pick_side_door"
            ]
          },
          villa_porch_d: {
            id: "villa_porch_d",
            district: "D",
            sector: "D-3",
            name: "\u72EC\u680B\u522B\u5885\u6B63\u95E8\u7384\u5173",
            light: "bright",
            crowd: "none",
            surveillance: "dense",
            cover: 0,
            indoor: true,
            strike_sealed: false,
            sanctuary: true,
            transit_port: false,
            exits: [
              "villa_garden_d",
              "garage_side_door_d"
            ],
            spots: [
              "smart_lock",
              "home_safe"
            ]
          }
        }
      };
    }
  });

  // src/runtime/map.js
  var require_map = __commonJS({
    "src/runtime/map.js"(exports, module) {
      var defaultPlacesData = require_places();
      var MapRuntime = class {
        constructor(data = defaultPlacesData) {
          this.districts = data.districts || {};
          this.places = data.places || {};
        }
        getPlace(placeId) {
          return this.places[placeId] || null;
        }
        getDistrict(districtId) {
          return this.districts[districtId] || null;
        }
        getExits(placeId) {
          const place = this.getPlace(placeId);
          return place ? place.exits || [] : [];
        }
        isStrikeAllowed(placeId) {
          const place = this.getPlace(placeId);
          if (!place) return false;
          return !place.strike_sealed;
        }
        isTransitPort(placeId) {
          const place = this.getPlace(placeId);
          if (!place) return false;
          return !!place.transit_port;
        }
        // 逃跑 AI 寻路：广度优先搜索 (BFS) 寻找最近的庇护所 (Sanctuary)
        findNearestSanctuary(startPlaceId, maxDepth = 4) {
          const start = this.getPlace(startPlaceId);
          if (!start) return null;
          if (start.sanctuary) return startPlaceId;
          const queue = [{ id: startPlaceId, depth: 0, path: [startPlaceId] }];
          const visited = /* @__PURE__ */ new Set([startPlaceId]);
          while (queue.length > 0) {
            const current = queue.shift();
            if (current.depth >= maxDepth) continue;
            const place = this.getPlace(current.id);
            if (!place) continue;
            for (const nextId of place.exits) {
              if (!visited.has(nextId)) {
                visited.add(nextId);
                const nextPlace = this.getPlace(nextId);
                if (nextPlace && nextPlace.sanctuary) {
                  return {
                    sanctuaryId: nextId,
                    steps: current.depth + 1,
                    nextStep: current.path[1] || nextId,
                    fullPath: [...current.path, nextId]
                  };
                }
                queue.push({
                  id: nextId,
                  depth: current.depth + 1,
                  path: [...current.path, nextId]
                });
              }
            }
          }
          return null;
        }
        // 计算天气与当前场所节点的动态耦合修正
        getWeatherModifiers(weather = "clear", placeId) {
          const place = this.getPlace(placeId);
          if (!place) return { tags: [], mods: {} };
          if (place.indoor) {
            return {
              tags: [],
              mods: { indoorImmunity: true }
            };
          }
          const result = { tags: [], mods: {} };
          if (weather === "rain") {
            result.tags.push("tag_rain");
            result.mods.stealth = 1;
            result.mods.sound = -2;
            result.mods.faceCover = 2;
            const slipperyPlaces = ["old_skybridge_b", "river_steps_c", "village_main_c", "narrow_gap_c"];
            if (slipperyPlaces.includes(placeId)) {
              result.tags.push("tag_slippery");
              result.mods.slipRisk = true;
            }
          } else if (weather === "storm") {
            result.tags.push("tag_storm");
            result.mods.stealth = 2;
            result.mods.sound = -5;
            result.mods.followSpeed = -2;
            result.mods.surveillanceDiscount = 0.5;
            const slipperyPlaces = ["old_skybridge_b", "river_steps_c", "village_main_c", "narrow_gap_c", "private_road_d"];
            if (slipperyPlaces.includes(placeId)) {
              result.tags.push("tag_slippery");
              result.mods.slipRisk = true;
            }
          }
          return result;
        }
      };
      var defaultMap = new MapRuntime();
      module.exports = {
        MapRuntime,
        defaultMap,
        getPlace: (id) => defaultMap.getPlace(id),
        getDistrict: (id) => defaultMap.getDistrict(id),
        getExits: (id) => defaultMap.getExits(id),
        isStrikeAllowed: (id) => defaultMap.isStrikeAllowed(id),
        isTransitPort: (id) => defaultMap.isTransitPort(id),
        findNearestSanctuary: (id, maxDepth) => defaultMap.findNearestSanctuary(id, maxDepth),
        getWeatherModifiers: (weather, placeId) => defaultMap.getWeatherModifiers(weather, placeId)
      };
    }
  });

  // src/runtime/facts.js
  var require_facts = __commonJS({
    "src/runtime/facts.js"(exports, module) {
      var LP = require_lifepack();
      var R = require_rules();
      var RAW_LEXICON = require_lexicon();
      var map = require_map();
      var SLOTS = ["home", "schedule", "carry", "social", "psyche", "romance"];
      var FACT_TAGS = ["gym"];
      var L2_TICKET_GATE = {
        carry: ["photo", "scan", "listen", "note", "watch_lights"],
        social: ["watch_peers"],
        romance: ["hear_gossip", "chat", "watch_peers"]
      };
      function loadPack(id, data = LP) {
        return data.packs[id] || null;
      }
      function l1FormulaHold(unlock = LP.unlock) {
        return SLOTS.every(
          (s) => unlock.L1[s] === null || unlock.L1[s] === Math.floor((unlock.L2[s] || 0) / 2)
        );
      }
      function slotLevel(slot, intel = {}, unlock = LP.unlock) {
        const pi = intel.pi || 0;
        for (const lv of [3, 2, 1]) {
          const t = unlock["L" + lv][slot];
          if (t === null) {
            if (lv === 3) return 3;
            continue;
          }
          if (pi >= t) return lv;
        }
        return 0;
      }
      function factVisible(fact, level, tickets = [], slot = fact.slot) {
        if (fact.public) return true;
        if (level < fact.level) return false;
        const set = tickets instanceof Set ? tickets : new Set(tickets);
        if (fact.level === 3) return (fact.reveal_via || []).some((a) => set.has(a));
        if (fact.level === 2) {
          const gate = L2_TICKET_GATE[slot];
          return !gate || gate.some((a) => set.has(a));
        }
        return true;
      }
      function view(packId, intel = {}, data = LP) {
        const pack = loadPack(packId, data);
        if (!pack) return null;
        const levels = {};
        const facts = [];
        for (const slot of SLOTS) levels[slot] = slotLevel(slot, intel, data.unlock);
        const factList = intel && (intel.assignedFacts || intel.facts) || pack.factPool || [];
        for (const f of factList) {
          if (factVisible(f, levels[f.slot], intel.tickets || [])) {
            facts.push({ id: f.id, slot: f.slot, level: f.level, title: f.title, text: f.text, place: f.place });
          }
        }
        return { pack: packId, levels, facts };
      }
      function nightConditions(packId, rng, data = LP) {
        const pack = loadPack(packId, data);
        if (!pack) return null;
        return pack.conditions.map((c) => {
          const p = Math.round(c.mod * (1 - pack.stability) * 1e6) / 1e6;
          return { id: c.id, title: c.title, active: rng() < p };
        });
      }
      function effectiveAcuity(per, traits = []) {
        let mod = 0;
        for (const t of traits) {
          const tid = typeof t === "string" ? t : t && t.id;
          const def = R.tags && R.tags[tid];
          if (def && def.category === "acuity" && typeof def.value === "number") {
            mod += def.value;
          }
        }
        return Math.max(1, Math.min(10, per + mod));
      }
      function packHasGym(packId, data = LP) {
        const pack = loadPack(packId, data);
        if (!pack) return false;
        return (pack.factPool || []).some((f) => f.slot === "schedule" && (f.tags || []).includes("gym"));
      }
      function validate(pack, data = LP) {
        const errors = [];
        const at = `pack(${pack.id || "?"})`;
        if (!pack.id || !pack.name) errors.push(`${at}: \u7F3A id/name`);
        for (const k of ["str", "agi", "per", "nrv"]) {
          if (typeof pack.stats?.[k] !== "number") errors.push(`${at}: stats.${k} \u7F3A\u5931`);
        }
        if (typeof pack.social !== "number") errors.push(`${at}: social \u7F3A\u5931`);
        if (typeof pack.stability !== "number" || pack.stability <= 0 || pack.stability >= 1)
          errors.push(`${at}: stability \u987B\u5728 (0,1) \u5F00\u533A\u95F4`);
        const tagIds = new Set(Object.keys(RAW_LEXICON.tags));
        for (const t of pack.traits || []) {
          if (!tagIds.has(t)) errors.push(`${at}: traits "${t}" \u4E0D\u5728\u8BCD\u8868 tags\uFF08\u9ED1\u6237\uFF09`);
        }
        const entryIds = new Set(RAW_LEXICON.entries.map((e) => e.id));
        for (const f of pack.factPool || []) {
          const fat = `${at}.fact(${f.id || "?"})`;
          if (!f.id || !f.title || !f.text) errors.push(`${fat}: \u7F3A id/title/text`);
          if (!SLOTS.includes(f.slot)) errors.push(`${fat}: \u975E\u6CD5\u69FD\u4F4D ${f.slot}`);
          if (![1, 2, 3].includes(f.level)) errors.push(`${fat}: \u975E\u6CD5\u5C42\u7EA7 ${f.level}`);
          if (f.place && !map.getPlace(f.place)) errors.push(`${fat}: place "${f.place}" \u4E0D\u5728 places.json`);
          for (const a of f.reveal_via || []) {
            if (!entryIds.has(a)) errors.push(`${fat}: reveal_via "${a}" \u4E0D\u5728\u8BCD\u8868 entries\uFF08\u9ED1\u6237\uFF09`);
          }
          for (const t of f.tags || []) {
            if (!FACT_TAGS.includes(t)) errors.push(`${fat}: tags "${t}" \u4E0D\u5728\u4E8B\u5B9E\u6807\u8BB0\u767D\u540D\u5355\uFF08\u9ED1\u6237\uFF09`);
          }
        }
        for (const r of pack.routes || []) {
          for (const step of r.path || []) {
            if (!map.getPlace(step.place)) errors.push(`${at}.route(${r.id}): \u8282\u70B9 "${step.place}" \u4E0D\u5728 places.json`);
          }
        }
        return errors;
      }
      module.exports = {
        SLOTS,
        FACT_TAGS,
        L2_TICKET_GATE,
        loadPack,
        l1FormulaHold,
        slotLevel,
        factVisible,
        view,
        nightConditions,
        effectiveAcuity,
        packHasGym,
        validate
      };
    }
  });

  // src/runtime/target_state.js
  var require_target_state = __commonJS({
    "src/runtime/target_state.js"(exports, module) {
      var D = require_dice();
      var T = require_tags();
      var LP = require_lifepack();
      var R = require_rules();
      function isWeekend(date) {
        const day = ((date || 1) - 1) % 7 + 1;
        return day >= 6;
      }
      function toSeed(seed) {
        if (typeof seed === "number") return seed >>> 0;
        return D.floorSeed(String(seed || 0), 0);
      }
      function weightedSample(list, seed, weightKey = "weight") {
        if (!list || !list.length) return { item: null, next: null };
        const total = list.reduce((s, it) => s + (it[weightKey] || 1), 0);
        const next = D.rng(toSeed(seed));
        const r = next() * total;
        let acc = 0;
        for (const it of list) {
          acc += it[weightKey] || 1;
          if (r <= acc) return { item: it, next };
        }
        return { item: list[list.length - 1], next };
      }
      var PERSONALITY_STYLE_MAP = {
        casual: ["casual"],
        stubborn: ["casual", "cool"],
        vigilant: ["cool", "casual"],
        timid: ["elegant", "sweet"],
        gentle: ["elegant"],
        introverted: ["elegant", "cool"],
        aloof: ["cool", "casual"],
        cheerful: ["casual", "sweet"],
        chic: ["sweet"],
        naive: ["sweet", "elegant"],
        guarded: ["cool", "casual", "elegant"],
        oblivious: ["casual"]
      };
      var SWEET_EXCLUDE_FOR_COOL = /* @__PURE__ */ new Set(["outfit_sailor_jk", "outfit_plaid_jk", "outfit_lolita_jsk"]);
      function sampleOutfit(pack, date, seed, persona) {
        const p = pack || LP.packs.college || LP.packs.student;
        const weekend = isWeekend(date);
        if (p.outfits && p.outfits.length) {
          const personalityId = persona && (persona.personalityId || persona.personalityTag || persona.personality) || pack && pack.traits && pack.traits.find((t) => PERSONALITY_STYLE_MAP[t]) || "casual";
          const allowedStyles = PERSONALITY_STYLE_MAP[personalityId] || ["casual", "elegant"];
          let candidates = p.outfits.filter((o) => allowedStyles.includes(o.styleGroup));
          if (personalityId === "aloof" || personalityId === "stubborn") {
            candidates = candidates.filter((o) => !SWEET_EXCLUDE_FOR_COOL.has(o.id));
          }
          if (!candidates.length) {
            candidates = p.outfits.filter((o) => !SWEET_EXCLUDE_FOR_COOL.has(o.id));
          }
          if (!candidates.length) candidates = p.outfits;
          if (persona && persona.shoeId && candidates.some((o) => o.shoeId === persona.shoeId)) {
            candidates = candidates.filter((o) => o.shoeId === persona.shoeId);
          }
          const idx = typeof seed === "number" && Number.isFinite(seed) ? Math.abs(seed) % candidates.length : Math.floor(Math.random() * candidates.length);
          const item = candidates[idx];
          return {
            id: item.id,
            name: item.name,
            desc: item.desc,
            prompt: item.prompt,
            socks: item.socks || "",
            shoeId: item.shoeId || "shoe_sneakers",
            shoeName: item.shoeName || "\u8FD0\u52A8\u978B",
            styleGroup: item.styleGroup,
            isWeekend: weekend
          };
        }
        if (weekend && p.weekendOutfitPool && p.weekendOutfitPool.length) {
          const { item } = weightedSample(p.weekendOutfitPool, seed);
          return {
            id: item.id,
            name: item.name,
            desc: item.desc,
            prompt: item.prompt,
            shoeId: item.shoeId || "shoe_sneakers",
            shoeName: item.shoeName || "\u8FD0\u52A8\u978B",
            isWeekend: true
          };
        }
        const targetDef = R.targets && R.targets.list && R.targets.list[p.id];
        const defaultShoeId = targetDef?.shoe || "shoe_heel";
        const def = p.defaultOutfit || {
          id: "outfit_default",
          name: "\u65E5\u5E38\u8863\u88C5",
          desc: "\u89C4\u77E9\u5E38\u670D",
          prompt: "\u767D\u63CF\u5176\u89C4\u77E9\u5F97\u4F53\u7684\u65E5\u5E38\u88C5\u675F",
          shoeId: defaultShoeId,
          shoeName: R.tags && R.tags[defaultShoeId]?.name || "\u65E5\u5E38\u978B\u5177"
        };
        return {
          id: def.id,
          name: def.name,
          desc: def.desc,
          prompt: def.prompt,
          shoeId: def.shoeId || defaultShoeId,
          shoeName: def.shoeName || "\u5C0F\u76AE\u978B",
          isWeekend: false
        };
      }
      function isLimpingDate(date, lastHotelDate) {
        if (!lastHotelDate || !date) return false;
        return date === lastHotelDate + 2 || date === lastHotelDate + 3;
      }
      function sampleSomatic(pack, seed, opts = {}) {
        if (opts.isLimping) {
          return {
            id: "limping",
            name: "\u6B65\u5C65\u8E52\u8DDA",
            desc: "\u53CC\u817F\u8F7B\u5FAE\u5E76\u62E2\uFF0C\u8FC8\u6B65\u7A0D\u5927\u65F6\u8F7B\u5FAE\u5438\u6C14\uFF0C\u4F3C\u89E6\u53CA\u75DB\u5904\uFF0C\u654F\u6377 -2",
            mod: { agi: -2 },
            reason: "\u5468\u672B\u4EB2\u5BC6\u521D\u8BD5\u540E\u7684\u751F\u7406\u53D7\u8FEB\u53CD\u5E94\uFF0C\u6B65\u6001\u8FDF\u7F13\u6536\u655B",
            tag: "somatic_limping",
            prompt: "\u767D\u63CF\u5C11\u5973\u6B65\u6001\u660E\u663E\u6536\u655B\u53D8\u5C0F\uFF0C\u4E24\u817F\u5FAE\u5E76\uFF0C\u8FC8\u6B65\u8F7B\u7F13\u4E14\u5076\u5C14\u8F7B\u5FAE\u5438\u6C14\uFF0C\u4F3C\u89E6\u53CA\u9690\u79D8\u75DB\u5904\uFF0C\u795E\u8272\u7565\u5E26\u5C40\u4FC3"
          };
        }
        const p = pack || LP.packs.college || LP.packs.student;
        if (!p.somaticPool || !p.somaticPool.length) {
          return {
            id: "normal",
            name: "\u5E73\u5E38\u72B6\u6001",
            desc: "\u57FA\u7EBF\u5E73\u6DE1",
            mod: {},
            reason: "\u65E5\u5E38\u665A\u5F52\uFF0C\u5FC3\u5883\u5E73\u7A33",
            tag: null,
            prompt: "\u767D\u63CF\u5176\u5E73\u9759\u5300\u901F\u7684\u6B65\u6001"
          };
        }
        const { item, next } = weightedSample(p.somaticPool, seed);
        let reason = "";
        if (item.reasons && item.reasons.length) {
          const idx = Math.floor(next() * item.reasons.length);
          reason = item.reasons[idx] || item.reasons[0];
        }
        return {
          id: item.id,
          name: item.name,
          desc: item.desc || "",
          mod: item.mod || {},
          reason,
          tag: item.tag || (item.id === "normal" ? null : "somatic_" + item.id),
          prompt: item.prompt || ""
        };
      }
      function resolveHand(pack, placeId, currentHand, seed, opts = {}) {
        const p = pack || LP.packs.college || LP.packs.student;
        const pool = p.handPool || {};
        if ((opts.isCarriage || placeId === "metro_carriage" || placeId === "carriage") && pool.carriagePool && pool.carriagePool.length) {
          const { item: item2 } = weightedSample(pool.carriagePool, seed);
          return {
            id: item2.id,
            name: item2.name,
            desc: item2.desc || "",
            fumbling: !!item2.fumbling,
            tag: item2.tag || (item2.fumbling ? "hand_fumble" : null),
            remainingDuration: item2.duration || 1,
            isSiteOverride: false,
            isCarriage: true
          };
        }
        if (placeId && pool.siteOverrides && pool.siteOverrides[placeId]) {
          const ov = pool.siteOverrides[placeId];
          return {
            id: ov.id,
            name: ov.name,
            desc: ov.desc || "",
            fumbling: !!ov.fumbling,
            tag: ov.tag || (ov.fumbling ? "hand_fumble" : null),
            remainingDuration: 1,
            isSiteOverride: true
          };
        }
        if (currentHand && !currentHand.isSiteOverride && (currentHand.remainingDuration || 0) > 1) {
          return {
            ...currentHand,
            remainingDuration: currentHand.remainingDuration - 1
          };
        }
        const enRoute = pool.enRoute || [
          { id: "normal", name: "\u81EA\u7136\u5782\u624B", weight: 100, duration: 2, tag: null, desc: "\u81EA\u7136\u6446\u81C2\u524D\u884C" }
        ];
        const { item } = weightedSample(enRoute, seed);
        return {
          id: item.id,
          name: item.name,
          desc: item.desc || "",
          fumbling: !!item.fumbling,
          tag: item.tag || null,
          remainingDuration: item.duration || 1,
          isSiteOverride: false
        };
      }
      function syncTargetStateTags(stack, targetState) {
        const removePrefixes = ["hand_", "somatic_"];
        for (let i = stack.length - 1; i >= 0; i--) {
          const t = stack[i];
          if (t.owner === "target" && t.id && removePrefixes.some((p) => t.id.startsWith(p))) {
            stack.splice(i, 1);
          }
        }
        if (!targetState) return;
        if (targetState.somatic && targetState.somatic.tag) {
          const tagDef = R.tags && R.tags[targetState.somatic.tag];
          if (tagDef) {
            T.apply(stack, {
              id: tagDef.id,
              name: tagDef.name,
              owner: "target",
              type: "status",
              category: tagDef.category || "status",
              effects: tagDef.value ? [{ category: tagDef.category, value: tagDef.value }] : [],
              duration: { type: "night" }
            });
          }
        }
        if (targetState.hand && targetState.hand.tag) {
          const tagDef = R.tags && R.tags[targetState.hand.tag];
          if (tagDef) {
            T.apply(stack, {
              id: tagDef.id,
              name: tagDef.name,
              owner: "target",
              type: "scene",
              category: tagDef.category || "stealth",
              effects: tagDef.value ? [{ category: tagDef.category, value: tagDef.value }] : [],
              duration: { type: "scene", count: targetState.hand.remainingDuration || 1 }
            });
          }
        }
        if (targetState.hand && targetState.hand.fumbling && (!targetState.hand.tag || targetState.hand.tag !== "hand_fumble")) {
          const tagDef = R.tags && R.tags.hand_fumble;
          if (tagDef) {
            T.apply(stack, {
              id: tagDef.id,
              name: tagDef.name,
              owner: "target",
              type: "scene",
              category: tagDef.category || "stealth",
              effects: tagDef.value ? [{ category: tagDef.category, value: tagDef.value }] : [],
              duration: { type: "scene", count: 1 }
            });
          }
        }
      }
      function resolveSaturdayRoutine(pack, persona, seed) {
        if (persona && persona.saturdayRoutine) {
          return persona.saturdayRoutine;
        }
        const social = persona && persona.finalStats && persona.finalStats.social || persona && persona.social || pack && pack.social || 1;
        const personalityId = persona && (persona.personality?.id || persona.personality) || pack && pack.traits && pack.traits.find((t) => ["timid", "guarded", "stubborn", "gentle", "curious", "oblivious"].includes(t)) || "timid";
        let weights = { cram: 50, outing: 35, date: 15 };
        if (social <= 1) {
          if (personalityId === "timid" || personalityId === "guarded") {
            weights = { cram: 65, outing: 30, date: 5 };
          } else {
            weights = { cram: 55, outing: 35, date: 10 };
          }
        } else if (social === 2) {
          if (personalityId === "guarded" || personalityId === "stubborn") {
            weights = { cram: 45, outing: 40, date: 15 };
          } else {
            weights = { cram: 35, outing: 45, date: 20 };
          }
        } else {
          weights = { cram: 20, outing: 50, date: 30 };
        }
        const pool = [
          { id: "cram", weight: weights.cram },
          { id: "outing", weight: weights.outing },
          { id: "date", weight: weights.date }
        ];
        const { item } = weightedSample(pool, seed);
        return item.id;
      }
      function getDateHotelThreshold(personalityId) {
        if (personalityId === "timid" || personalityId === "anxious") return 4;
        if (personalityId === "guarded") return 3;
        return 2;
      }
      function resolveSaturdayRoute(pack, saturdayRoutine, dateCount, personalityId, seed, opts = {}) {
        const routes = pack?.routes || [];
        if (saturdayRoutine === "cram") {
          return routes.find((r) => r.id === "saturday_cram") || routes[0];
        }
        if (saturdayRoutine === "outing") {
          return routes.find((r) => r.id === "saturday_outing") || routes[0];
        }
        if (saturdayRoutine === "date") {
          const threshold = getDateHotelThreshold(personalityId);
          if ((dateCount || 0) >= threshold) {
            const next = D.rng(toSeed(seed));
            const isHotel = next() < 0.5;
            if (isHotel) {
              const base = routes.find((r) => r.id === "saturday_date_hotel") || routes.find((r) => r.id === "saturday_date_home") || routes[0];
              const isFirst = (opts.hotelVisitedCount || 0) === 0;
              return {
                ...base,
                isFirstHotel: isFirst,
                note: isFirst ? "\u5468\u516D\u9752\u6DA9\u7EA6\u4F1A\xB7\u672A\u77E5\u65B0\u52A8\u7EBF\u5206\u652F" : "\u5468\u516D\u60C5\u4FA3\u7EA6\u4F1A\xB7\u60C5\u4FA3\u65C5\u793E\u8D70\u5411",
                prompt: isFirst ? "\u767D\u63CF\u9752\u6DA9\u60C5\u4FA3\u521D\u6B21\u7275\u624B\u7684\u5C40\u4FC3\u4E0E\u5A07\u7F9E\uFF0C\u7EAF\u771F\u604B\u7231\u7684\u5FAE\u751C\u4E0E\u6069\u7231\u3002\u4E24\u4EBA\u5341\u6307\u7D27\u6263\uFF0C\u5E76\u80A9\u62D0\u5165\u4E00\u6761\u964C\u751F\u72ED\u7A84\u7684\u504F\u50FB\u4FA7\u5DF7\u6DF1\u5904\uFF1B\u5C11\u5973\u5FC3\u8DF3\u5FAE\u5FEB\u3001\u638C\u5FC3\u6CDB\u8D77\u7EC6\u6C57\uFF0C\u5E26\u7740\u5BF9\u8DE8\u5165\u5927\u4EBA\u4E16\u754C\u7684\u5411\u5F80\u4E0E\u7D27\u5F20\u3002\u4E25\u7981\u63D0\u524D\u5267\u900F\u76EE\u7684\u5730\u540D\u79F0\u3002" : "\u767D\u63CF\u60C5\u4FA3\u4E8C\u4EBA\u98DF\u9AD3\u77E5\u5473\u540E\u7684\u719F\u7A14\u4EB2\u6635\u4E0E\u6069\u7231\u7F20\u7EF5\uFF0C\u4F4E\u58F0\u8033\u8BED\u4E0E\u4EB2\u5BC6\u4F9D\u504E\uFF0C\u7275\u624B\u8F7B\u8F66\u719F\u8DEF\u8D70\u5411\u5DF7\u6DF1\u5904\u7684\u60C5\u4FA3\u65C5\u793E\u3002",
                known: isFirst ? [1, 1, 1, 0] : [1, 1, 1, 1]
              };
            }
          }
          return routes.find((r) => r.id === "saturday_date_home") || routes[0];
        }
        return routes.find((r) => r.days && r.days.includes(6)) || routes[0];
      }
      function resolveTargetFacts(pack, persona, seed = 12345) {
        const p = pack || LP.packs.college || LP.packs.student;
        if (!p) return { assignedFacts: [], factSummary: {} };
        if (persona && persona.assignedFacts && Array.isArray(persona.assignedFacts) && persona.assignedFacts.length) {
          return {
            assignedFacts: persona.assignedFacts,
            factSummary: persona.factSummary || {}
          };
        }
        if (!p.homePool) {
          const facts = (p.factPool || []).slice();
          return {
            assignedFacts: facts,
            factSummary: {}
          };
        }
        const next = D.rng(toSeed(seed));
        const personalityId = persona && (persona.personalityId || persona.personalityTag || persona.personality?.id || persona.personality) || "casual";
        const homePool = p.homePool || [];
        const chosenHome = homePool.length ? homePool[Math.floor(next() * homePool.length)] : null;
        function pickByPersonality(pool, prefMap) {
          if (!pool || !pool.length) return null;
          const weights = pool.map((branch) => {
            const prefs = prefMap && prefMap[branch.id] || branch.preferredPersonalities || [];
            return prefs.includes(personalityId) ? 3 : 1;
          });
          const totalW = weights.reduce((a, b) => a + b, 0);
          let r = next() * totalW;
          for (let i = 0; i < pool.length; i++) {
            r -= weights[i];
            if (r <= 0) return pool[i];
          }
          return pool[0];
        }
        const schedulePrefMap = {
          sched_academic: ["stubborn", "aloof", "vigilant", "introverted"],
          sched_parttime: ["gentle", "stubborn", "casual", "naive"],
          sched_socialite: ["cheerful", "chic", "naive", "casual"]
        };
        const chosenSchedule = pickByPersonality(p.schedulePool, schedulePrefMap);
        const carryPrefMap = {
          carry_academic: ["stubborn", "aloof", "vigilant", "introverted", "gentle"],
          carry_glamour: ["chic", "cheerful", "naive"],
          carry_casual: ["casual", "timid", "vigilant"]
        };
        const chosenCarry = pickByPersonality(p.carryPool, carryPrefMap);
        const socialPrefMap = {
          social_introvert: ["introverted", "aloof", "vigilant", "timid"],
          social_extrovert: ["cheerful", "chic", "naive"],
          social_moderate: ["gentle", "stubborn", "casual"]
        };
        const chosenSocial = pickByPersonality(p.socialPool, socialPrefMap);
        const psychePrefMap = {
          psyche_pride: ["stubborn", "aloof", "vigilant"],
          psyche_timid: ["timid", "gentle", "naive"],
          psyche_cautious: ["vigilant", "casual", "introverted", "chic"]
        };
        const chosenPsyche = pickByPersonality(p.psychePool, psychePrefMap);
        const romancePool = p.romancePool || [];
        let chosenRomance = null;
        if (persona && persona.romanceState) {
          chosenRomance = romancePool.find((r) => r.id === persona.romanceState) || null;
        }
        if (!chosenRomance && romancePool.length) {
          chosenRomance = romancePool[Math.floor(next() * romancePool.length)];
        }
        const chosenBranches = [chosenHome, chosenSchedule, chosenCarry, chosenSocial, chosenPsyche, chosenRomance].filter(Boolean);
        const assignedFacts = [];
        for (const b of chosenBranches) {
          if (b.facts && Array.isArray(b.facts)) {
            for (const f of b.facts) assignedFacts.push(f);
          }
        }
        const factSummary = {
          home: chosenHome ? chosenHome.id : null,
          schedule: chosenSchedule ? chosenSchedule.id : null,
          carry: chosenCarry ? chosenCarry.id : null,
          social: chosenSocial ? chosenSocial.id : null,
          psyche: chosenPsyche ? chosenPsyche.id : null,
          romance: chosenRomance ? chosenRomance.id : null
        };
        if (persona) {
          persona.assignedFacts = assignedFacts;
          persona.factSummary = factSummary;
        }
        return { assignedFacts, factSummary };
      }
      module.exports = {
        isWeekend,
        isLimpingDate,
        sampleOutfit,
        sampleSomatic,
        resolveHand,
        syncTargetStateTags,
        resolveSaturdayRoutine,
        getDateHotelThreshold,
        resolveSaturdayRoute,
        resolveTargetFacts
      };
    }
  });

  // src/config/wardrobe.json
  var require_wardrobe = __commonJS({
    "src/config/wardrobe.json"(exports, module) {
      module.exports = {
        note: "\u670D\u88C5\u56FE\u9274\uFF1A\u53D8\u4F53\u89C4\u5219 head\u2192\u53D1\u578B\u3001top\u2192\u901A\u7528/\u957F\u53D1\xD7\u4F53\u578B\u3001bottom/socks/shoes\u2192\u5171\u7528",
        variants: {
          hair: [
            "long",
            "ponytail",
            "twintails",
            "bob"
          ],
          body: [
            "slim",
            "normal",
            "full"
          ]
        },
        items: [
          {
            id: "head_ribbon_navy",
            name: "\u85CF\u9752\u53D1\u5E26",
            slot: "head",
            angles: [
              "side",
              "back"
            ]
          },
          {
            id: "head_clip_plaid",
            name: "\u683C\u7EB9\u53D1\u5939",
            slot: "head",
            angles: [
              "side",
              "back"
            ]
          },
          {
            id: "head_earphone_wired",
            name: "\u767D\u8272\u6709\u7EBF\u8033\u673A",
            slot: "head",
            angles: [
              "side",
              "back"
            ]
          },
          {
            id: "top_jk_blazer",
            name: "\u85CF\u9752\u897F\u88C5\u5916\u5957",
            slot: "top",
            angles: [
              "front",
              "side",
              "back"
            ]
          },
          {
            id: "top_jk_sailor",
            name: "\u767D\u5E95\u6C34\u624B\u670D\u4E0A\u8863",
            slot: "top",
            angles: [
              "front",
              "side",
              "back"
            ]
          },
          {
            id: "top_jk_shirt",
            name: "\u767D\u886C\u886B",
            slot: "top",
            angles: [
              "front",
              "side",
              "back"
            ]
          },
          {
            id: "top_jk_cardigan",
            name: "\u7C73\u8272\u9488\u7EC7\u5F00\u886B",
            slot: "top",
            angles: [
              "front",
              "side",
              "back"
            ]
          },
          {
            id: "top_jk_hoodie",
            name: "\u6D45\u7C73\u7070\u8FDE\u5E3D\u536B\u8863",
            slot: "top",
            angles: [
              "front",
              "side",
              "back"
            ]
          },
          {
            id: "top_jk_knit",
            name: "\u5976\u767D\u84EC\u677E\u9488\u7EC7\u886B",
            slot: "top",
            angles: [
              "front",
              "side",
              "back"
            ]
          },
          {
            id: "top_jk_baseball",
            name: "\u62FC\u8272\u68D2\u7403\u670D",
            slot: "top",
            angles: [
              "front",
              "side",
              "back"
            ]
          },
          {
            id: "bottom_jk_pleat_navy",
            name: "\u85CF\u9752\u767E\u8936\u77ED\u88D9",
            slot: "bottom",
            angles: [
              "front",
              "side",
              "back"
            ]
          },
          {
            id: "bottom_jk_pleat_plaid",
            name: "\u683C\u7EB9\u767E\u8936\u77ED\u88D9",
            slot: "bottom",
            angles: [
              "front",
              "side",
              "back"
            ]
          },
          {
            id: "bottom_jk_denim",
            name: "\u6C34\u6D17\u725B\u4ED4\u77ED\u88D9",
            slot: "bottom",
            angles: [
              "front",
              "side",
              "back"
            ]
          },
          {
            id: "bottom_jk_shorts",
            name: "\u8FD0\u52A8\u77ED\u88E4",
            slot: "bottom",
            angles: [
              "front",
              "side",
              "back"
            ]
          },
          {
            id: "sock_knee_black",
            name: "\u9ED1\u8272\u53CA\u819D\u889C",
            slot: "socks",
            angles: [
              "front",
              "side",
              "back"
            ]
          },
          {
            id: "sock_thigh_white",
            name: "\u767D\u8272\u8FC7\u819D\u889C",
            slot: "socks",
            angles: [
              "front",
              "side",
              "back"
            ]
          },
          {
            id: "sock_pile_cream",
            name: "\u7C73\u767D\u5806\u5806\u889C",
            slot: "socks",
            angles: [
              "front",
              "side",
              "back"
            ]
          },
          {
            id: "sock_sport_stripe",
            name: "\u6761\u7EB9\u8FD0\u52A8\u957F\u889C",
            slot: "socks",
            angles: [
              "front",
              "side",
              "back"
            ]
          },
          {
            id: "sock_cotton_short",
            name: "\u7EAF\u767D\u77ED\u68C9\u889C",
            slot: "socks",
            angles: [
              "front",
              "side",
              "back"
            ]
          },
          {
            id: "shoe_leather",
            name: "\u5236\u670D\u5C0F\u76AE\u978B",
            slot: "shoes",
            angles: [
              "three-quarter",
              "side"
            ]
          },
          {
            id: "shoe_sneakers",
            name: "\u8FD0\u52A8\u978B",
            slot: "shoes",
            angles: [
              "three-quarter",
              "side"
            ]
          },
          {
            id: "shoe_platform",
            name: "\u677E\u7CD5\u978B",
            slot: "shoes",
            angles: [
              "three-quarter",
              "side"
            ]
          },
          {
            id: "shoe_flats",
            name: "\u5E73\u5E95\u978B",
            slot: "shoes",
            angles: [
              "three-quarter",
              "side"
            ]
          }
        ],
        outfits: {
          outfit_jk_uniform: {
            top: "top_jk_blazer",
            bottom: "bottom_jk_pleat_navy",
            socks: "sock_knee_black",
            shoes: "shoe_leather",
            head: "head_ribbon_navy"
          },
          outfit_jk_sailor: {
            top: "top_jk_sailor",
            bottom: "bottom_jk_pleat_navy",
            socks: "sock_knee_black",
            shoes: "shoe_leather",
            head: "head_ribbon_navy"
          },
          outfit_jk_plaid: {
            top: "top_jk_shirt",
            bottom: "bottom_jk_pleat_plaid",
            socks: "sock_pile_cream",
            shoes: "shoe_platform",
            head: "head_clip_plaid"
          },
          outfit_jk_hoodie: {
            top: "top_jk_hoodie",
            bottom: "bottom_jk_denim",
            socks: "sock_cotton_short",
            shoes: "shoe_sneakers",
            head: "head_earphone_wired"
          },
          outfit_jk_knit: {
            top: "top_jk_knit",
            bottom: "bottom_jk_pleat_plaid",
            socks: "sock_thigh_white",
            shoes: "shoe_platform",
            head: null
          },
          outfit_jk_baseball: {
            top: "top_jk_baseball",
            bottom: "bottom_jk_shorts",
            socks: "sock_sport_stripe",
            shoes: "shoe_sneakers",
            head: null
          },
          outfit_jk_cardigan: {
            top: "top_jk_cardigan",
            bottom: "bottom_jk_pleat_navy",
            socks: "sock_knee_black",
            shoes: "shoe_leather",
            head: null
          }
        }
      };
    }
  });

  // src/runtime/album.js
  var require_album = __commonJS({
    "src/runtime/album.js"(exports, module) {
      var WARDROBE = require_wardrobe();
      var DIR = (item, persona) => {
        if (item.slot === "head") return `hair/${persona.hair || "long"}`;
        if (item.slot === "top") {
          const body = persona.body || "normal";
          return persona.hair === "long" ? `long/${body}` : `base/${body}`;
        }
        return "shared";
      };
      var fileOf = (item, persona, angle) => `jk/${item.slot}/${DIR(item, persona)}/${item.id}/${angle}.png`;
      var anglesFor = (dist) => {
        if (dist === "far") return [];
        if (dist === "same") return ["side", "back"];
        return ["front", "side", "back"];
      };
      function captureList(persona, owned, dist) {
        const allowed = anglesFor(dist);
        if (!allowed.length) return [];
        const own = new Set(owned);
        const out = [];
        for (const item of WARDROBE.items) {
          for (const angle of item.angles) {
            if (!allowed.includes(angle)) continue;
            const key = `${item.id}|${angle}`;
            if (own.has(key)) continue;
            out.push({ item, angle, key, file: fileOf(item, persona, angle) });
          }
        }
        return out;
      }
      function totalFor(persona) {
        return captureList(persona, [], "touch").length;
      }
      function setBonus(album, done = {}) {
        const ids = new Set(Object.keys(album).map((k) => k.split("|")[0]));
        const newly = [];
        for (const [outfitId, set] of Object.entries(WARDROBE.outfits)) {
          if (done[outfitId]) continue;
          const need = [set.top, set.bottom, set.socks, set.shoes].filter(Boolean);
          if (need.every((id) => ids.has(id))) {
            done[outfitId] = true;
            newly.push(outfitId);
          }
        }
        return { pi: newly.length * 2, outfits: newly };
      }
      module.exports = { DIR, fileOf, anglesFor, captureList, totalFor, setBonus, WARDROBE };
    }
  });

  // src/runtime/game.js
  var require_game = __commonJS({
    "src/runtime/game.js"(exports, module) {
      var { loadLexicon, normalize: D_norm } = require_lexicon2();
      var { parseFloor, verifyEvidence } = require_parse();
      var T = require_tags();
      var C = require_checks();
      var D = require_dice();
      var { createLedger } = require_ledger();
      var facts = require_facts();
      var map = require_map();
      var R = require_rules();
      var LP = require_lifepack();
      var TS = require_target_state();
      var ALBUM = require_album();
      var DIST_KEY = { far: "far", same: "same", close: "close", touch: "touch" };
      var DIST_CN = { far: "\u8FDC\u7AEF", same: "\u540C\u8857", close: "\u8EAB\u540E", touch: "\u8D34\u8EAB" };
      var DIST_RANK = { far: 0, same: 1, close: 2, touch: 3 };
      var DIST_DOWN = { touch: "close", close: "same", same: "far", far: "far" };
      var CA_CN = { front: "\u6B63\u9762", side: "\u4FA7\u9762", back: "\u80CC\u9762", "three-quarter": "\u659C\u4FA7" };
      var WEATHER_BANDS = { clear: [1, 14], rain: [15, 18], storm: [19, 20] };
      var WEATHER_ICON = { clear: "\u{1F319} \u6674\u591C", rain: "\u{1F327} \u5C0F\u96E8", storm: "\u26C8 \u66B4\u96E8" };
      var HUNTER_MODES = ["stealth", "contact", "vehicle"];
      var TAIL_PUMP_IDS = ["follow", "ride_along", "transfer", "follow_work", "ride_follow", "car_follow"];
      var SHOE_ID_MAP = {
        shoe_heel: "heel",
        shoe_flats: "flats",
        shoe_sneakers: "sneakers",
        shoe_barefoot: "barefoot",
        shoe_slippers: "slippers",
        shoe_boots: "boots",
        shoe_platform: "platform",
        shoe_sandals: "sandals",
        shoe_leather: "leather"
      };
      var SHOE_DIST_FACTOR = { far: 0.6, same: 1, close: 1.25, touch: 1.5 };
      function createGame(init = {}) {
        const lex = loadLexicon();
        let salt = init.sessionSalt || D.newSessionSalt();
        const g = {
          sessionSalt: salt,
          player: init.player || { str: 4, agi: 5, nrv: 5, int: 5, cha: 5, staminaMax: 120 },
          target: init.target || { str: 3, agi: 4, per: 5, nrv: 4, social: 2 },
          targetId: init.targetId || init.saved && init.saved.targetId || "college",
          targetPersona: init.targetPersona || init.saved && init.saved.targetPersona || null,
          targetState: init.targetState || init.saved && init.saved.targetState || null,
          mode: init.mode || "stealth",
          dist: init.dist || "same",
          env: init.env || "night",
          slot: init.slot || "e21_23",
          tickets: init.tickets || [],
          // 本楼事件票据 [{no, kind, guide}]
          ticketsIssued: init.ticketsIssued || 1,
          world: init.world || { weather: "clear", district: "B" },
          // 每晚天气与她所在大区（真源在脚本）
          route: init.route || null,
          // 她的当晚动线 {nodes:[placeId], known:[0|1], here:int}
          dateCount: init.dateCount || init.saved && init.saved.dateCount || 0,
          hotelVisitedCount: init.hotelVisitedCount || init.saved && init.saved.hotelVisitedCount || 0,
          lastHotelDate: init.lastHotelDate ?? (init.saved && init.saved.lastHotelDate) ?? null,
          famSegs: init.famSegs || { A: 0, B: 0, C: 0, D: 0 },
          // 分区熟悉度段数（10 段熟区）
          proxLogs: init.proxLogs || [],
          signals: init.signals || [],
          lastAssess: init.lastAssess || null,
          lastHerAlert: init.lastHerAlert || null,
          lastLedgerSummary: init.lastLedgerSummary || null,
          consecFails: 0,
          logs: [],
          /* 过档行为（她的警觉每跨一档做一件事，一晚一档只响一次） */
          alertLatch: init.alertLatch || [],
          alertEvent: init.alertEvent || null,
          alertHold: init.alertHold || 0,
          fleeing: !!init.fleeing,
          /* 相册：键＝itemId|角度；值是这张照片的元信息 */
          album: init.album || {},
          setBonusDone: init.setBonusDone || {},
          capture: null
        };
        if (g.targetPersona) {
          if (!g.targetPersona.hair) {
            const i = D.rollD20(D.actionSeed(salt, 0, "hair")).d20 % ALBUM.WARDROBE.variants.hair.length;
            g.targetPersona.hair = ALBUM.WARDROBE.variants.hair[i];
          }
          if (!g.targetPersona.body) {
            const i = D.rollD20(D.actionSeed(salt, 0, "body")).d20 % ALBUM.WARDROBE.variants.body.length;
            g.targetPersona.body = ALBUM.WARDROBE.variants.body[i];
          }
        }
        if (g.targetPersona && !g.targetPersona.assignedFacts) {
          const pack = LP.packs && LP.packs[g.targetId] || LP.packs.college || LP.packs.student;
          TS.resolveTargetFacts(pack, g.targetPersona, D.actionSeed(salt, 0, "facts"));
        }
        if (g.targetPersona && g.targetPersona.finalStats) {
          g.target = Object.assign({}, g.target, g.targetPersona.finalStats);
        }
        g.targetBase = { ...g.target };
        function applyTargetState() {
          if (!g.targetState) return;
          g.target = { ...g.targetBase };
          if (g.targetState.somatic && g.targetState.somatic.mod) {
            for (const [k, v] of Object.entries(g.targetState.somatic.mod)) {
              if (g.target[k] !== void 0) {
                g.target[k] = Math.max(1, g.target[k] + v);
              }
            }
          }
          TS.syncTargetStateTags(g.tags || (g.tags = []), g.targetState);
          const isWeekend = g.targetState.outfit && g.targetState.outfit.isWeekend;
          const isCollege = g.targetId === "college";
          const outfitShoe = (isWeekend || isCollege) && g.targetState.outfit && g.targetState.outfit.shoeId || g.targetPersona && g.targetPersona.shoeId || g.targetState.outfit && g.targetState.outfit.shoeId;
          if (outfitShoe && R.tags && R.tags[outfitShoe]) {
            const stack = g.tags || (g.tags = []);
            const oldShoe = stack.find((t) => t.owner === "target" && t.id && t.id.startsWith("shoe_"));
            if (oldShoe && oldShoe.id !== outfitShoe) {
              T.remove(stack, oldShoe.id);
              const def = R.tags[outfitShoe];
              T.apply(stack, {
                id: def.id,
                name: def.name,
                owner: "target",
                type: "equipment",
                category: "equipment",
                effects: [],
                duration: { type: "flag" }
              });
            }
          }
          applyShoeMod(g.target);
        }
        function activeShoeDef() {
          const tag = (g.tags || []).find((t) => t.owner === "target" && t.id && t.id.startsWith("shoe_"));
          return tag && R.tags ? R.tags[tag.id] || null : null;
        }
        function applyShoeMod(stats) {
          const def = activeShoeDef();
          if (!def || !def.mod || !stats) return stats;
          for (const [k, v] of Object.entries(def.mod)) {
            if (stats[k] !== void 0) stats[k] = Math.max(1, Math.min(10, stats[k] + v));
          }
          return stats;
        }
        function initTargetState(dateOverride) {
          const pack = LP.packs && LP.packs[g.targetId] || LP.packs.college || LP.packs.student;
          const d = dateOverride ?? (L.get("date") || 1);
          const dayOfWeek = ((d || 1) - 1) % 7 + 1;
          const isLimping = TS.isLimpingDate(d, g.lastHotelDate);
          if (dayOfWeek === 6 && (pack.id === "student" || pack.id === "college") && !g.route) {
            const routine = g.targetPersona?.saturdayRoutine || (g.targetPersona ? g.targetPersona.saturdayRoutine = TS.resolveSaturdayRoutine(pack, g.targetPersona, D.actionSeed(salt, 0, "saturday_routine")) : "cram");
            const personalityId = g.targetPersona?.personality?.id || g.targetPersona?.personality || "timid";
            const routeDef = TS.resolveSaturdayRoute(pack, routine, g.dateCount || 0, personalityId, D.actionSeed(salt, d, "saturday_route_branch"), { hotelVisitedCount: g.hotelVisitedCount || 0 });
            if (routeDef) {
              const startT = routeDef.path && routeDef.path[0] && routeDef.path[0].t ? `${routeDef.path[0].t.slice(0, 2)}:${routeDef.path[0].t.slice(2)}` : "21:00";
              g.route = {
                id: routeDef.id,
                note: routeDef.note,
                prompt: routeDef.prompt,
                startTime: startT,
                nodes: routeDef.path.map((p) => p.place),
                times: routeDef.path.map((p) => p.t),
                here: 0,
                known: routeDef.known || routeDef.path.map(() => 1)
              };
            }
          } else if (dayOfWeek === 7 && (pack.id === "student" || pack.id === "college") && !g.route) {
            const sundayRoute = (pack.routes || []).find((r) => r.id === "sunday_rest") || {
              id: "sunday_rest",
              note: "\u5468\u65E5\u5168\u5929\u5C45\u5BB6\u4F11\u6574\uFF08\u4E0D\u51FA\u95E8\uFF09",
              prompt: "\u767D\u63CF\u5C11\u5973\u5468\u65E5\u5168\u5929\u5728\u5BD3\u6240\u5185\u5B89\u9759\u4F11\u6574\uFF0C\u7A97\u5E18\u62C9\u8D77\uFF0C\u672A\u66FE\u5916\u51FA\uFF0C\u8857\u9053\u4E0A\u65E0\u5176\u8DB3\u8FF9",
              path: [{ place: "unit_stairs_b", t: "2000" }]
            };
            g.route = {
              id: sundayRoute.id,
              note: sundayRoute.note,
              prompt: sundayRoute.prompt,
              startTime: "20:00",
              nodes: sundayRoute.path.map((p) => p.place),
              times: sundayRoute.path.map((p) => p.t),
              here: 0,
              known: [1]
            };
            g.tailing = false;
          }
          const outfit = TS.sampleOutfit(pack, d, D.actionSeed(salt, d, "outfit"), g.targetPersona || g.target);
          const somatic = TS.sampleSomatic(pack, D.actionSeed(salt, d, "somatic"), { isLimping });
          const curPlaceId = g.route && g.route.here >= 0 ? g.route.nodes[g.route.here] : g.route && g.route.nodes ? g.route.nodes[0] : null;
          const curPlaceName = curPlaceId ? map.getPlace(curPlaceId)?.name || curPlaceId : null;
          const hand = TS.resolveHand(pack, curPlaceId, null, D.actionSeed(salt, g.floor || 0, "hand"));
          g.targetState = {
            outfit,
            somatic,
            hand,
            route: g.route ? {
              id: g.route.id,
              note: g.route.note,
              prompt: g.route.prompt,
              startTime: g.route.startTime,
              here: g.route.here || 0,
              nodes: g.route.nodes,
              currentPlace: curPlaceName
            } : null
          };
          applyTargetState();
        }
        g.player.inventory = Array.isArray(init.inventory) ? init.inventory : Array.isArray(g.player.inventory) ? g.player.inventory : [];
        g.nightDrinkUsed = !!init.nightDrinkUsed;
        const L = g.ledger = createLedger({ ...init.stats, nrv: g.player.nrv });
        applyIdentity(init.identity, { targetGym: init.targetGym, packId: init.packId });
        syncThresholdTags();
        syncEquippedTags();
        syncTargetShoeTags();
        syncPersonaTags();
        if (!g.targetState) initTargetState();
        else applyTargetState();
        if (init.saved) {
          const s = init.saved;
          if (s.sessionSalt !== void 0) salt = s.sessionSalt;
          for (const k of [
            "player",
            "target",
            "targetId",
            "targetPersona",
            "targetState",
            "mode",
            "dist",
            "env",
            "slot",
            "world",
            "route",
            "famSegs",
            "tags",
            "floor",
            "consecFails",
            "tickets",
            "ticketsIssued",
            "identity",
            "startKit",
            "proxLogs",
            "signals",
            "lastAssess",
            "lastHerAlert",
            "lastLedgerSummary",
            "nightDrinkUsed",
            "dateCount",
            "hotelVisitedCount",
            "lastHotelDate",
            "alertLatch",
            "alertEvent",
            "alertHold",
            "fleeing",
            "album",
            "setBonusDone",
            "captureSeq"
          ]) {
            if (s[k] !== void 0) g[k] = s[k];
          }
          if (s.targetBase !== void 0) g.targetBase = { ...s.targetBase };
          if (s.inventory !== void 0) g.player.inventory = JSON.parse(JSON.stringify(s.inventory));
          if (s.tailing !== void 0) g.tailing = s.tailing;
          if (s.nightPiGross) g.nightPiGross = s.nightPiGross;
          g.sessionSalt = salt;
          Object.assign(L.state, s.ledgerState || {});
          g.logs = [];
          syncThresholdTags();
          syncEquippedTags();
          syncTargetShoeTags();
          syncPersonaTags();
          applyTargetState();
        }
        (function backfillRouteTimes() {
          const r = g.route;
          if (!r || !Array.isArray(r.nodes)) return;
          if (Array.isArray(r.times) && r.times.length === r.nodes.length) return;
          const pack = LP.packs && LP.packs[g.targetId] || LP.packs.college || LP.packs.student;
          const def = (pack.routes || []).find((x) => x.id === r.id);
          if (!def || !Array.isArray(def.path) || def.path.length !== r.nodes.length) return;
          r.times = def.path.map((p) => p.t);
          if (!r.startTime && def.path[0] && def.path[0].t) {
            r.startTime = `${def.path[0].t.slice(0, 2)}:${def.path[0].t.slice(2)}`;
          }
          applyTargetState();
        })();
        function log(line) {
          g.logs.push(line);
        }
        function seedFor(seq) {
          return D.actionSeed(salt, g.floor || 0, seq);
        }
        function isFamiliar() {
          return L.get("proximity") >= 20 && L.get("proximity") < 40;
        }
        function distFactor() {
          return R.alert.distFactor[g.dist] ?? 1;
        }
        function targetEffectiveAcuity() {
          const acuityMod = T.summarize(g.tags || [], "acuity").sum;
          return Math.max(1, Math.min(10, (g.target.per || 4) + acuityMod));
        }
        function gain({ threat = null, dist = g.dist, stim = 0 }) {
          const alertD = threat ? C.alertDelta({ threat, dist, env: g.env, acuity: targetEffectiveAcuity(), familiar: isFamiliar() }) : 0;
          const heartD = stim ? C.heartDelta({ stim, nrv: g.player.nrv }) : 0;
          return { alertD, heartD };
        }
        function runCheck(entry, args, seq) {
          const cat = categoryOf(entry.id);
          const sum = T.summarize(g.tags || (g.tags = []), cat);
          const mods = sum.breakdown.filter((h) => h.owner !== "target").map((h) => ({ src: h.src, v: h.v }));
          const targetMod = sum.breakdown.filter((h) => h.owner === "target").reduce((s, h) => s + h.v, 0);
          const pity = T.PITY_BONUS && g.consecFails >= 2 ? C.pityBonus(g.consecFails) : 0;
          if (pity) mods.push({ src: "\u8FDE\u8D25\u4FDD\u5E95", v: pity });
          const dc = (R.checks[entry.check] ?? 10) - targetMod;
          const advTagged = (g.tags || []).some((t) => t.id === "adv_" + attrKeyOf(entry.id));
          const mode = args && args.adv || advTagged ? "adv" : args && args.dis ? "dis" : "normal";
          const roll = D.rollD20(seedFor(seq), mode);
          const res = C.d20Check({
            d20: roll.d20,
            attr: attrOf(entry.id),
            mods,
            dc,
            stealth: (R.check.graceIds || []).includes(entry.id)
          });
          const attrKey = attrKeyOf(entry.id);
          const ATTR_NAMES = { agi: "\u654F\u6377", str: "\u4F53\u683C", int: "\u60C5\u62A5", cha: "\u53E3\u624D", nrv: "\u80C6\u91CF" };
          const attr = { name: ATTR_NAMES[attrKey] || "\u5C5E\u6027", v: attrOf(entry.id) };
          const targetTags = sum.breakdown.filter((h) => h.owner === "target");
          const darkReveal = targetTags.length ? targetTags.map((h) => `${h.src} (${h.v >= 0 ? "+" : ""}${h.v})`).join("\u3001") : null;
          return { roll, res, mods, dc, sum, attr, targetMod, darkReveal };
        }
        function attrKeyOf(id) {
          const agility = [
            "follow",
            "approach",
            "withdraw",
            "hide",
            "wall",
            "enter_tail",
            "stop",
            "wait",
            "cross",
            "cover",
            "fake_phone",
            "fake_call",
            "shop_enter",
            "window_watch",
            "cafe_sit",
            "ride_along",
            "transfer",
            "follow_work",
            "ride_follow",
            "car_follow",
            "climb"
          ];
          const brawn = ["barrier", "pry", "drag", "pin", "lockpick", "break_in"];
          const intel = [
            "photo",
            "scan",
            "deduce",
            "timing",
            "listen",
            "perch",
            "note",
            "record",
            "plate",
            "trash",
            "pick",
            "listen_home",
            "locate",
            "watch_lights",
            "check_mailbox",
            "watch_visitor",
            "check_camera",
            "check_door",
            "stair_lurk",
            "door_listen",
            "door_peep",
            "try_handle",
            "ransack",
            "plant_bug",
            "cover_tracks",
            "plan_exit",
            "wait_gate",
            "watch_peers",
            "check_desk",
            "hear_gossip",
            "stalk_social",
            "monitor_social",
            "check_parcel",
            "get_number",
            "stakeout"
          ];
          const charm = [
            "greet",
            "chat",
            "ease",
            "misdirection",
            "respond_her",
            "answer_guard",
            "fake_visit",
            "audit_class",
            "lobby_lurk",
            "apply_job",
            "pump_person",
            "bribe"
          ];
          if (brawn.includes(id)) return "str";
          if (charm.includes(id)) return "cha";
          if (intel.includes(id)) return "int";
          return "agi";
        }
        function attrOf(id) {
          return g.player[attrKeyOf(id)];
        }
        function categoryOf(id) {
          const fine = ["photo", "record", "pick", "ransack", "lockpick", "plant_bug", "cover_tracks"];
          const conflict = ["strike", "pin", "drag"];
          const social = [
            "greet",
            "chat",
            "ease",
            "misdirection",
            "respond_her",
            "answer_guard",
            "fake_visit",
            "audit_class",
            "lobby_lurk",
            "apply_job",
            "pump_person",
            "bribe"
          ];
          if (fine.includes(id)) return "fine";
          if (conflict.includes(id)) return "conflict";
          if (social.includes(id)) return "social";
          return "stealth";
        }
        function currentPlaceKind() {
          const id = g.route && Array.isArray(g.route.nodes) && g.route.here >= 0 ? String(g.route.nodes[g.route.here] || "") : "";
          if (!id) return "";
          if (/unit|stairs|gate|door|porch|lobby|entrance/.test(id)) return "door";
          if (/residence|room|home|flat|apartment|villa/.test(id)) return "room";
          const name = String((map.getPlace(id) || {}).name || "");
          if (/楼道|单元|门|玄关|电梯|台阶|入口/.test(name)) return "door";
          if (/客厅|卧室|房间|室内|屋内|玄关内/.test(name)) return "room";
          return "";
        }
        function placeNameNow() {
          if (!g.route || !Array.isArray(g.route.nodes)) return "";
          const id = g.route.nodes[g.route.here];
          return id && (map.getPlace(id) || {}).name || "";
        }
        function capturePhoto(dist) {
          const persona = g.targetPersona || {};
          const owned = Object.keys(g.album || {});
          const cands = ALBUM.captureList(persona, owned, dist);
          if (!cands.length) return null;
          g.captureSeq = (g.captureSeq || 0) + 1;
          const pick = cands[D.rollD20(D.actionSeed(salt, g.floor || 1, "capture_" + g.captureSeq)).d20 % cands.length];
          const meta = {
            file: pick.file,
            name: pick.item.name,
            slot: pick.item.slot,
            angle: pick.angle,
            t: g.floor || 1,
            place: placeNameNow(),
            dist
          };
          g.album[pick.key] = meta;
          let piBonus = 0;
          if (dist === "touch" && pick.angle === "front") piBonus += 1;
          const sb = ALBUM.setBonus(g.album, g.setBonusDone);
          piBonus += sb.pi;
          g.lastCapture = { key: pick.key, ...meta, piBonus, outfits: sb.outfits };
          g.capture = g.lastCapture;
          g.signals = g.signals || [];
          g.signals.push(["\u7167\u7247", `\u62CD\u5230 ${pick.item.name}\uFF08${CA_CN[pick.angle] || pick.angle}\uFF09`]);
          if (g.signals.length > 20) g.signals.shift();
          return g.lastCapture;
        }
        function settleAction(tag, seq) {
          const entry = lex.byId.get(tag.id);
          if (!entry) return null;
          const out = { type: "action", id: tag.id, name: tag.name, label: tag.label || tag.name };
          if (!(entry.modes || []).includes(g.mode) && !(entry.modes || []).includes("any")) {
            out.rejected = true;
            out.reason = `\u52A8\u4F5C [${tag.name}] \u9700\u8981\u6A21\u5F0F\uFF1A${(entry.modes || []).join("/")}`;
            return out;
          }
          const req = entry.requires;
          if (req) {
            if (req.place) {
              const kind = currentPlaceKind();
              if (kind !== req.place) {
                const label = req.place === "door" ? "\u95E8\u524D / \u697C\u9053 / \u7384\u5173" : "\u5BA4\u5185";
                out.rejected = true;
                out.reason = `\u52A8\u4F5C [${tag.name}] \u53EA\u80FD\u5728${label}\u4F7F\u7528\uFF08\u5F53\u524D\u4E0D\u5728\u8BE5\u573A\u6240\uFF09`;
                return out;
              }
            }
            const dist2 = DIST_KEY[tag.args?.dist] || g.dist;
            if (Array.isArray(req.dist) && req.dist.length && !req.dist.includes(dist2)) {
              out.rejected = true;
              out.reason = `\u52A8\u4F5C [${tag.name}] \u9700\u8981\u8DDD\u79BB\uFF1A${req.dist.map((d) => DIST_CN[d] || d).join(" / ")}\uFF08\u5F53\u524D ${DIST_CN[dist2] || dist2}\uFF09`;
              return out;
            }
            if (Array.isArray(req.items) && req.items.length) {
              const held = (g.player.inventory || []).filter((it) => req.items.includes(it.id) && (it.count || 1) > 0);
              if (!held.length) {
                const names = req.items.map((id) => R.items && R.items[id] && R.items[id].name || id).join(" / ");
                out.rejected = true;
                out.reason = `\u52A8\u4F5C [${tag.name}] \u9700\u8981\u968F\u8EAB\u5DE5\u5177\uFF1A${names}\uFF08\u53EF\u5728\u7EC8\u7AEF\xB7\u6218\u672F\u884C\u56CA\u5185\u8D2D\u4E70\u4E0E\u88C5\u5907\uFF09`;
                return out;
              }
            }
          }
          if (tag.id === "strike" && (tag.args?.style || "ambush") === "ambush" && g.dist !== "touch") {
            out.rejected = true;
            out.reason = `\u52A8\u4F5C [${tag.name}\xB7\u5077\u88AD] \u9700\u8981\u8D34\u8EAB\uFF08\u5F53\u524D ${DIST_CN[g.dist] || g.dist}\uFF09`;
            return out;
          }
          if (tag.id === "breath" && L.get("heart") <= 20) {
            out.rejected = true;
            out.reason = `\u52A8\u4F5C [${tag.name}] \u5FC3\u8DF3\u5DF2\u5728\u4F4E\u4F4D\uFF08${L.get("heart")} \u2264 20\uFF09\uFF0C\u7F13\u606F\u65E0\u6548`;
            return out;
          }
          if (!entry.check) {
            out.noRoll = true;
            if (tag.id === "breath") {
              const gainAmt = C.breathGain(g.player.nrv);
              const r2 = L.commit({ heart: -Math.min(gainAmt, L.get("heart") - 20) }, { reason: "breath" });
              out.ledger = r2;
              out.text = `\u7F13\u606F\uFF1A\u5FC3\u8DF3 -${Math.max(0, -r2.applied.heart)}`;
            } else if (tag.id === "withdraw") {
              g.dist = "far";
              out.text = "\u8DDD\u79BB\u62C9\u5F00\u81F3\u76EE\u89C6\u8FDC\u7AEF";
            } else if (tag.id === "approach") {
              const RANK = DIST_RANK;
              const want = DIST_KEY[tag.args?.dist] || "close";
              if (RANK[g.dist] >= RANK.touch || RANK[want] <= RANK[g.dist]) {
                out.rejected = true;
                out.reason = RANK[g.dist] >= RANK.touch ? "\u52A8\u4F5C [\u8D34\u8FD1] \u5DF2\u8D34\u8EAB\uFF0C\u65E0\u6CD5\u518D\u9760\u8FD1" : `\u52A8\u4F5C [\u8D34\u8FD1] \u76EE\u6807\u8DDD\u79BB\uFF08${DIST_CN[want] || want}\uFF09\u4E0D\u6BD4\u5F53\u524D\uFF08${DIST_CN[g.dist] || g.dist}\uFF09\u66F4\u8FD1`;
                return out;
              }
              g.dist = want;
              out.text = `\u8DDD\u79BB\u8C03\u6574\u81F3 ${g.dist}`;
            } else {
              out.text = `${tag.name}\uFF1A\u5B8C\u6210\uFF08\u65E0\u68C0\u5B9A\uFF09`;
            }
            return out;
          }
          syncHeartTags();
          const { roll, res, mods, dc, attr, targetMod, darkReveal } = runCheck(entry, tag.args, seq);
          out.d20 = roll.d20;
          out.raw = roll.raw;
          out.mods = mods;
          out.dc = dc;
          out.total = res.total;
          out.band = res.band;
          out.attr = attr;
          out.targetMod = targetMod;
          out.darkReveal = darkReveal;
          let alertD = 0, heartD = 0, piD = 0, faceMemD = 0, staminaD = -(entry.cost?.stamina || 0);
          const dist = DIST_KEY[tag.args?.dist] || g.dist;
          if (res.band === "success") {
            piD = Math.round(2 * (0.6 + g.player.int * 0.06));
            if (tag.id === "follow") g.dist = dist;
            if (tag.id === "withdraw") g.dist = "far";
          } else if (res.band === "grace") {
            const gg = gain({ threat: "minor", dist });
            alertD = gg.alertD;
            heartD = gg.heartD + 5;
            piD = Math.round(1 * (0.6 + g.player.int * 0.06));
            faceMemD = C.faceMemGain({ band: "grace" });
          } else if (res.band === "fail") {
            const gg = gain({ threat: "minor", dist });
            alertD = gg.alertD;
            heartD = gg.heartD;
          } else if (res.band === "nat1") {
            const gg = gain({ threat: "medium", dist });
            alertD = gg.alertD;
            heartD = gg.heartD;
            faceMemD = C.faceMemGain({ band: "nat1" });
          } else if (res.band === "nat20") {
            piD = Math.round(4 * (0.6 + g.player.int * 0.06)) + 2;
            if (tag.id === "follow") g.dist = dist;
          }
          if (tag.id === "photo" && (res.band === "success" || res.band === "nat20")) {
            const cap = capturePhoto(dist);
            if (cap) {
              piD += cap.piBonus;
              out.capture = cap;
            } else {
              piD = 0;
              out.captureEmpty = true;
            }
          }
          syncHeartTags();
          const r = L.settleAction({ alertD, heartD, piD, staminaD, faceMemD }, { reason: tag.id });
          out.ledger = { seq: r.seq, applied: r.applied };
          if (piD > 0) g.nightPiGross = (g.nightPiGross || 0) + piD;
          if (g.identity === "detective" && tag.id === "follow") {
            if (res.band === "fail" || res.band === "nat1") g.tailing = false;
            else g.tailing = true;
          }
          if (tag.id === "timing") {
            if (res.band === "nat20" || res.band === "success") {
              g.lastAssess = "\u8BFB\u65F6\u673A\u8BC4\u4F30\uFF1A\u76EE\u6807\u5206\u5FC3\u9632\u5907\u677E\u61C8\uFF0C\u4FA7\u5411\u6B7B\u89D2\u66B4\u9732\uFF0C\u826F\u673A\uFF08+2 \u6218\u529B\uFF09";
            } else if (res.band === "grace") {
              g.lastAssess = "\u8BFB\u65F6\u673A\u8BC4\u4F30\uFF1A\u76EE\u6807\u5076\u6709\u505C\u987F\uFF0C\u4F46\u4F59\u5149\u4ECD\u6709\u987E\u53CA\uFF0C\u65F6\u673A\u5E73\u5E73";
            } else {
              g.lastAssess = "\u8BFB\u65F6\u673A\u8BC4\u4F30\uFF1A\u672A\u80FD\u6355\u6349\u5230\u6709\u6548\u7834\u7EFD\uFF0C\u8F7B\u4E3E\u5984\u52A8\u6613\u6253\u8349\u60CA\u86C7";
            }
          }
          g.consecFails = res.band === "fail" || res.band === "nat1" ? g.consecFails + 1 : 0;
          log(`[${tag.name}] 1d20(${roll.d20}) ${mods.map((m) => `${m.v >= 0 ? "+" : ""}${m.v} ${m.src}`).join(" ")} = ${res.total} vs DC ${dc} \u2192 ${res.band}`);
          return out;
        }
        function sweetHighNow() {
          const advNrv = (g.tags || []).some((t) => t.id === "adv_nrv");
          return R.check.sweetHigh + (advNrv ? R.advantage.sweetHighBonus : 0);
        }
        function syncHeartTags() {
          const lines = C.heartLines(L.get("heart"), sweetHighNow());
          const stack = g.tags || (g.tags = []);
          if (lines.deform === -2) T.apply(stack, { id: "deform", name: "\u64CD\u4F5C\u53D8\u5F62", owner: "player", category: "fine", effects: [{ category: "fine", value: -2 }], duration: { type: "flag" } });
          else if (lines.deform === 0) T.remove(stack, "deform");
          if (lines.crash) T.apply(stack, { id: "crash", name: "\u64CD\u4F5C\u5D29\u6E83", owner: "player", category: "fine", effects: [{ category: "fine", value: -2 }], duration: { type: "flag" } });
          else T.remove(stack, "crash");
        }
        function applyIdentity(identityId, opts = {}) {
          if (!identityId) return false;
          const def = R.identity.list[identityId];
          if (!def) {
            log(`[\u8EAB\u4EFD] \u672A\u77E5\u8EAB\u4EFD "${identityId}"\uFF0C\u5FFD\u7565`);
            return false;
          }
          g.identity = identityId;
          for (const [k, v] of Object.entries(def.mods || {})) {
            g.player[k] = Math.max(1, Math.min(10, (g.player[k] || 0) + v));
            if (k === "str") {
              g.player.staminaMax = 100 + g.player.str * 5;
            }
          }
          const stack = g.tags || (g.tags = []);
          for (const tid of def.tags || []) {
            const rt = R.tags[tid];
            if (!rt) {
              log(`[\u8EAB\u4EFD] \u6807\u7B7E "${tid}" \u672A\u5728 rules.tags \u6CE8\u518C\uFF08\u9ED1\u6237\uFF09`);
              continue;
            }
            T.apply(stack, {
              id: rt.id,
              name: rt.name,
              owner: rt.owner || "player",
              category: rt.category,
              effects: [{ category: rt.category, value: rt.value }],
              duration: { type: "flag" }
            });
          }
          if (def.gymProximity && (opts.targetGym || opts.packId && facts.packHasGym(opts.packId))) {
            L.commit({ proximity: def.gymProximity }, { reason: "identity_gym" });
            addProxLog(def.gymProximity, "\u5065\u8EAB\u623F\u884C\u7A0B (\u8EAB\u4EFD\u7279\u6743)");
            log(`[\u8EAB\u4EFD] \u5979\u7684\u65E5\u7A0B\u542B\u5065\u8EAB\u623F\uFF1A\u63A5\u8FD1\u5EA6 +${def.gymProximity}`);
          }
          if (def.startKit) {
            g.startKit = { ...def.startKit };
            if (def.startKit.item && !g.player.inventory.some((it) => it.id === def.startKit.item)) {
              g.player.inventory.push({ id: def.startKit.item, count: 1, equipped: false });
            }
          }
          return true;
        }
        function addProxLog(dv, reason) {
          if (!dv) return;
          const sign = dv > 0 ? "+" : "";
          const dateStr = `\u7B2C ${L.get("date")} \u665A`;
          const entry = `${sign}${dv} \xB7 ${reason} (${dateStr})`;
          g.proxLogs = g.proxLogs || [];
          g.proxLogs.push(entry);
          if (g.proxLogs.length > 20) g.proxLogs.shift();
        }
        function identityShift() {
          const rot = g.identity && R.identity.list[g.identity] ? R.identity.list[g.identity].shiftRotation : null;
          if (!rot) return null;
          return rot.order[Math.floor((L.get("date") - 1) / 7) % rot.order.length];
        }
        function syncThresholdTags() {
          const A = R.advantage;
          const stack = g.tags || (g.tags = []);
          const defs = [
            { id: "adv_int", name: "\u4F18\u52BF\uFF1A\u60C5\u62A5", on: L.get("pi") >= A.piThreshold },
            { id: "adv_agi", name: "\u4F18\u52BF\uFF1A\u654F\u6377", on: g.player.agi >= A.attrThreshold },
            { id: "adv_str", name: "\u4F18\u52BF\uFF1A\u4F53\u683C", on: g.player.str >= A.attrThreshold },
            { id: "adv_cha", name: "\u4F18\u52BF\uFF1A\u53E3\u624D", on: g.player.cha >= A.attrThreshold },
            { id: "adv_nrv", name: "\u4F18\u52BF\uFF1A\u80C6\u91CF", on: g.player.nrv >= A.attrThreshold }
          ];
          for (const d of defs) {
            if (d.on) T.apply(stack, {
              id: d.id,
              name: d.name,
              owner: "player",
              category: "advantage",
              effects: [],
              duration: { type: "flag" }
            });
            else T.remove(stack, d.id);
          }
          const attrDefs = [
            { id: "bulky", name: "\u8EAB\u5F62\u9192\u76EE", owner: "player", category: "stealth", value: -1, on: g.player.str >= 8 },
            { id: "unobtrusive", name: "\u4E0D\u8D77\u773C", owner: "player", category: "stealth", value: 1, on: g.player.str <= 3 },
            { id: "light_footed", name: "\u811A\u6B65\u8F7B", owner: "player", category: "stealth", value: 2, on: g.player.agi >= 8 },
            { id: "clumsy", name: "\u7B28\u62D9", owner: "player", category: "stealth", value: -2, on: g.player.agi <= 3 },
            { id: "stammer", name: "\u7ED3\u5DF4", owner: "player", category: "social", value: -2, on: g.player.cha <= 2 && L.get("heart") > 70 }
          ];
          for (const d of attrDefs) {
            if (d.on) {
              T.apply(stack, {
                id: d.id,
                name: d.name,
                owner: d.owner,
                category: d.category,
                effects: [{ category: d.category, value: d.value }],
                duration: { type: "flag" }
              });
            } else {
              T.remove(stack, d.id);
            }
          }
        }
        function syncEquippedTags() {
          const stack = g.tags || (g.tags = []);
          const equippedIds = /* @__PURE__ */ new Set();
          for (const it of g.player.inventory || []) {
            if (it.equipped) {
              equippedIds.add(it.id);
              const def = R.items && R.items[it.id];
              if (def && def.tag) {
                const rt = R.tags[def.tag];
                if (rt) {
                  T.apply(stack, {
                    id: rt.id,
                    name: rt.name,
                    owner: rt.owner || "player",
                    category: rt.category,
                    effects: rt.value ? [{ category: rt.category, value: rt.value }] : [],
                    duration: { type: "flag" }
                  });
                }
              }
            }
          }
          for (const [itemId, def] of Object.entries(R.items || {})) {
            if (def.tag && !equippedIds.has(itemId)) {
              T.remove(stack, def.tag);
            }
          }
        }
        function addItem(itemId, count = 1) {
          const def = R.items && R.items[itemId];
          if (!def) {
            log(`[\u884C\u56CA] \u672A\u77E5\u7269\u54C1 "${itemId}"`);
            return false;
          }
          g.player.inventory = g.player.inventory || [];
          const existing = g.player.inventory.find((it) => it.id === itemId);
          if (existing) {
            existing.count = (existing.count || 1) + count;
          } else {
            g.player.inventory.push({ id: itemId, count, equipped: false });
          }
          log(`[\u884C\u56CA] \u83B7\u5F97\u7269\u54C1\uFF1A${def.name} \xD7 ${count}`);
          return true;
        }
        function removeItem(itemId, count = 1) {
          g.player.inventory = g.player.inventory || [];
          const idx = g.player.inventory.findIndex((it2) => it2.id === itemId);
          if (idx < 0) return false;
          const it = g.player.inventory[idx];
          it.count = (it.count || 1) - count;
          if (it.count <= 0) {
            if (it.equipped) unequipItem(itemId);
            g.player.inventory.splice(idx, 1);
          }
          return true;
        }
        function equipItem(itemId) {
          g.player.inventory = g.player.inventory || [];
          const it = g.player.inventory.find((i) => i.id === itemId);
          if (!it) return { ok: false, reason: "\u884C\u56CA\u4E2D\u672A\u627E\u5230\u8BE5\u7269\u54C1" };
          const def = R.items && R.items[itemId];
          if (!def) return { ok: false, reason: "\u672A\u77E5\u7269\u54C1\u89C4\u5219" };
          if (!def.slot && def.type !== "tool" && def.type !== "gear" && def.type !== "disguise") {
            return { ok: false, reason: "\u8BE5\u7269\u54C1\u4E0D\u53EF\u968F\u8EAB\u88C5\u5907" };
          }
          const slot = def.slot || def.type;
          for (const other of g.player.inventory) {
            if (other.id !== itemId && other.equipped) {
              const otherDef = R.items && R.items[other.id];
              const otherSlot = otherDef?.slot || otherDef?.type;
              if (otherSlot === slot) {
                other.equipped = false;
                if (otherDef?.tag) T.remove(g.tags || [], otherDef.tag);
                log(`[\u884C\u56CA] \u69FD\u4F4D\u4E92\u65A5\uFF1A\u5378\u4E0B ${otherDef?.name || other.id}`);
              }
            }
          }
          it.equipped = true;
          syncEquippedTags();
          log(`[\u884C\u56CA] \u88C5\u5907\uFF1A${def.name}\uFF08\u69FD\u4F4D\uFF1A${slot}\uFF09`);
          return { ok: true, item: def.name, slot };
        }
        function unequipItem(itemId) {
          g.player.inventory = g.player.inventory || [];
          const it = g.player.inventory.find((i) => i.id === itemId);
          if (!it) return { ok: false, reason: "\u884C\u56CA\u4E2D\u672A\u627E\u5230\u8BE5\u7269\u54C1" };
          it.equipped = false;
          const def = R.items && R.items[itemId];
          if (def && def.tag) {
            T.remove(g.tags || [], def.tag);
          }
          log(`[\u884C\u56CA] \u5378\u4E0B\uFF1A${def?.name || itemId}`);
          return { ok: true, item: def?.name || itemId };
        }
        function useItem(itemId) {
          g.player.inventory = g.player.inventory || [];
          const it = g.player.inventory.find((i) => i.id === itemId && (i.count || 1) > 0);
          if (!it) return { ok: false, reason: "\u884C\u56CA\u4E2D\u65E0\u6B64\u53EF\u7528\u6D88\u8017\u54C1" };
          const def = R.items && R.items[itemId];
          if (!def || def.type !== "consumable") return { ok: false, reason: "\u8BE5\u7269\u54C1\u4E0D\u662F\u6D88\u8017\u54C1" };
          if (itemId === "energy_drink") {
            if (!HUNTER_MODES.includes(g.mode)) {
              return { ok: false, reason: "\u80FD\u91CF\u996E\u6599\u4EC5\u9650\u591C\u95F4\u884C\u52A8\u7A97\u53E3\u53EF\u7528" };
            }
            if (g.nightDrinkUsed) {
              return { ok: false, reason: "\u4ECA\u665A\u5DF2\u996E\u7528\u8FC7\u80FD\u91CF\u996E\u6599\uFF08\u6BCF\u665A\u9650\u4E00\u74F6\uFF09" };
            }
            g.nightDrinkUsed = true;
            removeItem(itemId, 1);
            const staminaMax = g.player.staminaMax || 100 + (g.player.str || 4) * 5;
            const curStam = L.get("stamina");
            const staminaGain = Math.min(20, staminaMax - curStam);
            L.commit({ stamina: staminaGain, heart: 10 }, { reason: "item_energy_drink" });
            syncHeartTags();
            log(`[\u884C\u56CA] \u996E\u7528\u80FD\u91CF\u996E\u6599\uFF1A\u4F53\u529B+${staminaGain}\uFF0C\u5FC3\u60B8\u5FC3\u8DF3+10`);
            return { ok: true, msg: "\u996E\u7528\u80FD\u91CF\u996E\u6599\uFF1A\u4F53\u529B+20\uFF0C\u5FC3\u60B8\u5FC3\u8DF3+10", stamina: staminaGain, heart: 10 };
          }
          if (itemId === "bento") {
            removeItem(itemId, 1);
            const staminaMax = g.player.staminaMax || 100 + (g.player.str || 4) * 5;
            const curStam = L.get("stamina");
            const staminaGain = Math.min(20, staminaMax - curStam);
            L.commit({ stamina: staminaGain }, { reason: "item_bento" });
            log(`[\u884C\u56CA] \u98DF\u7528\u4FBF\u5F53\uFF1A\u4F53\u529B+${staminaGain}`);
            return { ok: true, msg: `\u98DF\u7528\u4FBF\u5F53\uFF1A\u4F53\u529B+${staminaGain}`, stamina: staminaGain };
          }
          if (itemId === "onigiri") {
            removeItem(itemId, 1);
            const staminaMax = g.player.staminaMax || 100 + (g.player.str || 4) * 5;
            const curStam = L.get("stamina");
            const staminaGain = Math.min(8, staminaMax - curStam);
            L.commit({ stamina: staminaGain }, { reason: "item_onigiri" });
            log(`[\u884C\u56CA] \u98DF\u7528\u996D\u56E2\uFF1A\u4F53\u529B+${staminaGain}`);
            return { ok: true, msg: `\u98DF\u7528\u996D\u56E2\uFF1A\u4F53\u529B+${staminaGain}`, stamina: staminaGain };
          }
          if (itemId === "coffee") {
            removeItem(itemId, 1);
            log(`[\u884C\u56CA] \u996E\u7528\u70ED\u5496\u5561\uFF1A\u63D0\u795E\u9192\u8111`);
            return { ok: true, msg: "\u996E\u7528\u70ED\u5496\u5561\uFF1A\u63D0\u795E\u9192\u8111" };
          }
          return { ok: false, reason: "\u6682\u672A\u5B9E\u88C5\u8BE5\u6D88\u8017\u54C1\u4F7F\u7528\u6548\u679C" };
        }
        function syncTargetShoeTags() {
          const stack = g.tags || (g.tags = []);
          const found = stack.find((t) => t.owner === "target" && t.id && t.id.startsWith("shoe_"));
          if (found && SHOE_ID_MAP[found.id]) {
            return SHOE_ID_MAP[found.id];
          }
          const isWeekend = g.targetState && g.targetState.outfit && g.targetState.outfit.isWeekend;
          const isCollege = g.targetId === "college";
          const shoeTagId = (isWeekend || isCollege) && g.targetState && g.targetState.outfit && g.targetState.outfit.shoeId || g.targetPersona && g.targetPersona.shoeId || g.targetState && g.targetState.outfit && g.targetState.outfit.shoeId || R.targets && R.targets.list && R.targets.list[g.targetId] && R.targets.list[g.targetId].shoe || "shoe_heel";
          const def = R.tags && R.tags[shoeTagId] ? R.tags[shoeTagId] : R.tags.shoe_heel;
          if (def) {
            T.apply(stack, {
              id: def.id,
              name: def.name,
              owner: "target",
              type: "equipment",
              category: "equipment",
              effects: [],
              duration: { type: "flag" }
            });
            return SHOE_ID_MAP[def.id] || "heel";
          }
          return "heel";
        }
        function syncPersonaTags() {
          if (!g.targetPersona) return;
          const stack = g.tags || (g.tags = []);
          const pTagId = g.targetPersona.personalityTag || g.targetPersona.personalityId;
          if (pTagId && R.tags && R.tags[pTagId]) {
            const def = R.tags[pTagId];
            T.apply(stack, {
              id: def.id,
              name: def.name,
              owner: def.owner || "target",
              type: def.type || "personality",
              category: def.category || "social",
              effects: def.value ? [{ category: def.category, value: def.value }] : [],
              duration: { type: "flag" }
            });
          }
          const hTagId = g.targetPersona.hobbyTag || g.targetPersona.hobbyId;
          if (hTagId && R.tags && R.tags[hTagId]) {
            const def = R.tags[hTagId];
            T.apply(stack, {
              id: def.id,
              name: def.name,
              owner: def.owner || "scene",
              type: def.type || "hobby",
              category: def.category || "stealth",
              effects: def.value ? [{ category: def.category, value: def.value }] : [],
              duration: { type: "flag" }
            });
          }
        }
        function rollEnvSfx() {
          if (g.mode !== "stealth") return null;
          const here = g.route ? g.route.here : -1;
          const curId = g.route && here >= 0 ? g.route.nodes[here] : null;
          const cur = curId ? map.getPlace(curId) : null;
          if (!cur) return null;
          if (curId.includes("metro") || curId.includes("lobby") || curId.includes("store")) return null;
          const sfxSeed = D.actionSeed(salt, g.floor || 0, 99);
          const sfxRoll = D.rollD20(sfxSeed).d20;
          const isAlley = curId.includes("alley") || curId.includes("stairs") || curId.includes("backstreet") || (cur.spots || []).length > 1;
          const isResidential = curId.includes("unit") || curId.includes("residence") || curId.includes("stairs") || curId.includes("old");
          const catThreshold = g.dist === "touch" || g.dist === "close" ? 5 : 3;
          const dogLow = L.get("alert") >= 41 ? 17 : 19;
          if (isAlley && sfxRoll <= catThreshold) return "cat";
          if (isResidential && sfxRoll >= dogLow) return "dog";
          return null;
        }
        function translateInput(text) {
          const clauses = String(text || "").split(/[，,。；;\n！!？?·]+|然后|接着|顺便|之后|再试|同时/).map((s) => s.trim()).filter(Boolean);
          const out = [], seen = /* @__PURE__ */ new Set();
          for (const c of clauses) {
            if (out.length >= 3) break;
            const r = D_norm(c, lex);
            if (r.hit && !seen.has(r.id)) seen.add(r.id), out.push(r);
          }
          return out;
        }
        function settleInput(playerText, opts = {}) {
          let queue = [];
          if (opts.actions && opts.actions.length) {
            queue = opts.actions.map((act) => {
              const entry = act.id && lex.byId.get(act.id) || act.name && lex.byName.get(act.name);
              return {
                id: entry ? entry.id : act.id,
                name: entry ? entry.name : act.name,
                label: act.name || (entry ? entry.name : act.id),
                args: act.args || {}
              };
            }).filter((r) => r.id && lex.byId.has(r.id));
          } else if (opts.allowTextFallback === true) {
            queue = translateInput(playerText);
          }
          const results = processFloor(playerText || "", { ...opts, _actionQueue: queue, _fromInput: true });
          results.queue = queue.map((r) => ({ id: r.id, name: r.name, args: r.args }));
          results.package = {
            floor: results.floor,
            actions: results.actions.map((a) => ({
              id: a.id,
              name: a.name,
              label: a.label || a.name,
              d20: a.d20,
              total: a.total,
              dc: a.dc,
              band: a.band,
              mods: a.mods,
              attr: a.attr || null,
              targetMod: a.targetMod || 0,
              darkReveal: a.darkReveal || null,
              raw: a.raw,
              ledger: a.ledger,
              noRoll: a.noRoll,
              text: a.text,
              rejected: a.rejected || false,
              reason: a.reason || null
            })),
            account: results.floorApplied || null,
            seg: results.seg || null,
            logs: g.logs.slice(),
            narrativeOnly: queue.length === 0 || results.actions.length === 0,
            targetState: g.targetState ? JSON.parse(JSON.stringify(g.targetState)) : null,
            herAlert: g.lastHerAlert || null,
            alertEvent: g.alertEvent ? { ...g.alertEvent } : null
          };
          return results;
        }
        function processFloor(llmText, opts = {}) {
          const replyOnly = opts.replyOnly === true;
          if (!replyOnly) g.floor = opts.floor ?? (g.floor || 0) + 1;
          g.logs = [];
          g.lastHerAlert = null;
          g.capture = null;
          if (!replyOnly) g.alertEvent = null;
          if (!replyOnly) advanceRouteByClock();
          if (!replyOnly && g.fleeing && g.route) {
            herAdvance(true);
            if (g.route.here >= g.route.nodes.length - 1) g.tailing = false;
          }
          if (!replyOnly && g.targetState) {
            const pack = LP.packs && LP.packs[g.targetId] || LP.packs.college || LP.packs.student;
            const here = g.route ? g.route.here : -1;
            const curId = g.route && here >= 0 ? g.route.nodes[here] : null;
            g.targetState.hand = TS.resolveHand(pack, curId, g.targetState.hand, D.actionSeed(salt, g.floor || 0, "hand"));
            if (g.targetState.route && g.route) {
              g.targetState.route.here = here;
              g.targetState.route.currentPlace = curId ? map.getPlace(curId)?.name || curId : null;
            }
            applyTargetState();
          }
          const { tags, cleanText, diag } = parseFloor(llmText, lex);
          syncThresholdTags();
          const results = { floor: g.floor, actions: [], facts: [], lies: [], mode: null, diag, logs: g.logs, ledgerSeqs: [] };
          const floorApplied = { stamina: 0, heart: 0, alert: 0, pi: 0, proximity: 0, cash: 0 };
          const modeTag = tags.find((t) => t.type === "mode");
          if (modeTag) {
            g.mode = modeTag.mode;
            results.mode = modeTag.mode;
          }
          for (const lie of tags.filter((t) => t.type === "lie")) {
            const ok = verifyEvidence(cleanText, lie.claim);
            if (ok) results.lies.push({ ...lie, verified: true });
            else results.lies.push({ ...lie, verified: false, dropped: true });
          }
          let seq = 0;
          let heartPeak = L.get("heart");
          let tailFloor = null;
          const actionQueue = replyOnly ? [] : Array.isArray(opts._actionQueue) ? opts._actionQueue.map((a) => ({ type: "action", id: a.id, name: a.name, label: a.label || a.name, args: a.args })) : opts._fromInput ? [] : tags.filter((t) => t.type === "action");
          for (const tag of actionQueue) {
            const out = settleAction(tag, seq++);
            if (out) {
              results.actions.push(out);
              if (out.ledger?.seq) results.ledgerSeqs.push(out.ledger.seq);
              if (out.ledger?.applied) {
                for (const [k, v] of Object.entries(out.ledger.applied)) {
                  if (floorApplied[k] !== void 0) floorApplied[k] += v;
                }
              }
              if (!tailFloor && TAIL_PUMP_IDS.includes(tag.id) && out.band) {
                tailFloor = { band: out.band, dist: DIST_KEY[tag.args?.dist] || g.dist };
              }
            }
            heartPeak = Math.max(heartPeak, L.get("heart"));
          }
          if (!replyOnly) resolveAlertCross();
          if (!replyOnly && HUNTER_MODES.includes(g.mode)) {
            const P = R.heart.stim.pump;
            const calm = g.mode === "contact" && L.get("proximity") >= P.calmSocialProximity;
            const pumped = [];
            if (tailFloor && !calm) {
              let stim = 0, src = "";
              if (tailFloor.band === "nat1") {
                stim = P.exposed;
                src = "\u7206\u9732\u7167\u9762";
              } else if (tailFloor.band === "fail") {
                stim = P.lost;
                src = "\u8DDF\u4E22";
              } else if (tailFloor.band === "grace" || tailFloor.band === "nat20") {
                stim = 0;
              } else {
                stim = P.tail[tailFloor.dist] ?? P.tail.same;
                src = `\u6301\u7EED\u5C3E\u968F\xB7${tailFloor.dist}`;
              }
              if (stim > 0) pumped.push({ stim, src });
            }
            if (!tailFloor && g.mode === "contact" && !calm && tags.some((t) => t.type === "action" && lex.byId.get(t.id) && categoryOf(t.id) === "social")) {
              pumped.push({ stim: P.social, src: "\u4F2A\u88C5\u5BD2\u6684" });
            }
            const sfx = rollEnvSfx();
            g._envSfx = sfx;
            if (sfx) {
              let stim = P.env[sfx] || 0;
              const fam = g.famSegs[g.world.district] || 0;
              const halved = fam >= R.heart.areaFamiliarSegments;
              if (halved) stim = Math.round(stim * P.familiarEnvFactor);
              pumped.push({ stim, src: (sfx === "cat" ? "\u732B\u60CA\u53EB" : "\u72D7\u5420") + (halved ? "\xB7\u719F\u533A\u51CF\u534A" : "") });
            }
            for (const p of pumped) {
              if (p.stim <= 0) continue;
              const d = C.heartDelta({ stim: p.stim, nrv: g.player.nrv });
              if (d) {
                L.commit({ heart: d }, { reason: "stim" });
                floorApplied.heart += d;
                log(`[\u523A\u6FC0] ${p.src} +${p.stim} \u2192 \u5FC3\u8DF3 +${d}`);
              }
            }
            heartPeak = Math.max(heartPeak, L.get("heart"));
          } else {
            g._envSfx = null;
          }
          if (!replyOnly && HUNTER_MODES.includes(g.mode)) {
            const tax = C.staminaSegTax(heartPeak, sweetHighNow());
            if (tax) {
              L.commit({ stamina: tax }, { reason: "seg_tax" });
              floorApplied.stamina += tax;
              log(`[\u6BB5\u7A0E] \u5FC3\u8DF3\u5CF0\u503C ${heartPeak} \u2192 \u4F53\u529B ${tax}`);
            }
            const dropped = C.segHeartDrop(L.get("heart"), g.player.nrv);
            if (dropped !== L.get("heart")) {
              const dH = dropped - L.get("heart");
              L.commit({ heart: dH }, { reason: "seg_drop" });
              floorApplied.heart += dH;
            }
            results.seg = { heartPeak, staminaTax: tax };
            const d = g.world.district;
            if (d && g.famSegs[d] !== void 0) {
              g.famSegs[d] = Math.min(g.famSegs[d] + 1, R.heart.areaFamiliarSegments);
            }
          }
          if (floorApplied.proximity !== 0) {
            const actName = tags.find((t) => t.type === "action")?.name || "\u63A5\u89E6\u4EA4\u4E92";
            addProxLog(floorApplied.proximity, actName);
          }
          if (floorApplied.alert >= 8 || C.alertStage(L.get("alert")) >= 2) {
            const stage = C.alertStage(L.get("alert"));
            const pack = LP.packs && LP.packs[g.targetId] || LP.packs.college || LP.packs.student;
            const flavor = pack.flavor || {};
            if (stage === 3) g.lastHerAlert = `\u26A0\uFE0F \u76EE\u6807\u795E\u8272\u614C\u4E71\uFF0C\u811A\u6B65\u660E\u663E\u52A0\u5FEB\uFF01\uFF08${flavor.evade || "\u5C0F\u8DD1\u79BB\u5F00"}\uFF09`;
            else if (stage === 2) g.lastHerAlert = `\u26A0\uFE0F \u76EE\u6807\u653E\u6162\u811A\u6B65\uFF0C\u9891\u9891\u4FA7\u76EE\u56DE\u987E\uFF01\uFF08${flavor.face || "\u5077\u77A5\u8EAB\u540E"}\uFF09`;
            else if (floorApplied.alert >= 8) g.lastHerAlert = `\u26A0\uFE0F \u76EE\u6807\u4F3C\u4E4E\u6709\u6240\u5BDF\u89C9\uFF0C\u6B65\u4F10\u6709\u4E9B\u8FDF\u7591\uFF08${flavor.face || "\u7565\u5E26\u8B66\u60D5"}\uFF09`;
          }
          const timeMin = (g.floor || 1) * 15 % 120;
          const hh = 21 + Math.floor(timeMin / 60);
          const mm = (timeMin % 60).toString().padStart(2, "0");
          const tm = `${hh}:${mm}`;
          const firstAction = results.actions[0];
          let signalTxt = null;
          if (firstAction) {
            if (firstAction.id === "follow") signalTxt = "\u76EE\u6807\u6CBF\u8857\u524D\u884C\uFF0C\u7EF4\u6301\u7A33\u5B9A\u6B65\u9891";
            else if (firstAction.id === "photo") signalTxt = "\u76EE\u6807\u5728\u8DEF\u53E3\u77ED\u6682\u505C\u7559\uFF0C\u8BB0\u5F55\u5176\u6B63\u9762\u7279\u5F81";
            else if (firstAction.id === "scan") signalTxt = "\u76EE\u6807\u73AF\u987E\u56DB\u5468\uFF0C\u4FA7\u5411\u8EAB\u5F62\u6E05\u6670";
            else if (firstAction.id === "timing") signalTxt = "\u89C2\u5BDF\u5176\u4E3E\u6B62\u795E\u6001\uFF0C\u6355\u6349\u9632\u5907\u677E\u61C8\u95F4\u9699";
            else if (firstAction.id === "shop_enter") signalTxt = "\u76EE\u6807\u8FDB\u5165\u6CBF\u8857\u5546\u94FA\uFF0C\u9A7B\u8DB3\u8D27\u67B6\u524D";
            else signalTxt = "\u76EE\u6807\u4FDD\u6301\u884C\u8FDB\uFF0C\u4F60\u5728\u4FA7\u540E\u65B9\u89C2\u5BDF\u8BB0\u5F55";
          }
          if (signalTxt) {
            g.signals = g.signals || [];
            g.signals.push([tm, signalTxt]);
            if (g.signals.length > 20) g.signals.shift();
          }
          const parts = [];
          if (floorApplied.stamina) parts.push(`\u4F53\u529B ${floorApplied.stamina > 0 ? "+" : ""}${floorApplied.stamina}`);
          if (floorApplied.heart) parts.push(`\u5FC3\u8DF3 ${floorApplied.heart > 0 ? "+" : ""}${floorApplied.heart}`);
          if (floorApplied.alert) parts.push(`\u8B66\u89C9 ${floorApplied.alert > 0 ? "+" : ""}${floorApplied.alert}`);
          if (floorApplied.pi) parts.push(`PI ${floorApplied.pi > 0 ? "+" : ""}${floorApplied.pi}`);
          if (floorApplied.proximity) parts.push(`\u63A5\u8FD1\u5EA6 ${floorApplied.proximity > 0 ? "+" : ""}${floorApplied.proximity}`);
          if (floorApplied.cash) parts.push(`\u73B0\u91D1 ${floorApplied.cash > 0 ? "+" : ""}${floorApplied.cash}`);
          g.lastLedgerSummary = parts.length > 0 ? `\u672C\u8F6E\u7ED3\u7B97 \xB7 ${parts.join(" \xB7 ")}` : "\u672C\u8F6E\u7ED3\u7B97 \xB7 \u65E0\u6570\u503C\u53D8\u52A8";
          for (const t of tags.filter((t2) => t2.type === "fact")) {
            const issued = g.tickets.find((k) => k.no === t.ticket);
            results.facts.push({ ticket: t.ticket, consumed: !!issued });
          }
          g.tickets = [];
          results.floorApplied = floorApplied;
          results.stats = snapshot();
          results.capture = g.capture || null;
          results.flow = g.logs.slice();
          return results;
        }
        function processReply(llmText, opts = {}) {
          const filtered = String(llmText || "").replace(/<动作>[\s\S]*?<\/动作>/g, "");
          return processFloor(filtered, { ...opts, floor: g.floor, replyOnly: true });
        }
        function snapshot() {
          const s = L.state;
          const w = g.world;
          const districtObj = map.getDistrict(w.district);
          const here = g.route ? g.route.here : -1;
          const curId = g.route && here >= 0 ? g.route.nodes[here] : null;
          const cur = curId ? map.getPlace(curId) : null;
          const nextId = g.route && here >= 0 && here + 1 < g.route.nodes.length ? g.route.nodes[here + 1] : null;
          const routeView = g.route ? {
            id: g.route.id,
            note: g.route.note,
            startTime: g.route.startTime,
            times: g.route.times || null,
            nodes: g.route.nodes.map((id, i) => g.route.known && g.route.known[i] ? map.getPlace(id)?.name || id : id),
            known: g.route.known || g.route.nodes.map(() => 1),
            here
          } : null;
          const exits = cur ? cur.exits.map((id) => (map.getPlace(id)?.name || id) + (id === nextId ? " (\u524D)" : "")) : [];
          let sanctuaryAlert = "";
          if (cur) {
            if (cur.sanctuary) sanctuaryAlert = "\u5F53\u524D\u5373\u4E3A\u5B89\u5168\u5E87\u62A4\u573A\u6240";
            else {
              const sn = map.findNearestSanctuary(curId);
              sanctuaryAlert = sn ? `\u82E5\u76EE\u6807\u53D7\u60CA\uFF1A\u5C06\u5FAA\u6700\u8FD1\u901A\u8DEF\u9003\u5F80 [${map.getPlace(sn.sanctuaryId)?.name || sn.sanctuaryId}] (${sn.steps}\u6B65)` : "\u6B64\u5904\u547C\u6551\u65E0\u95E8\u2014\u2014\u58F0\u6D6A\u4F20\u5BFC\u8870\u51CF\u4E3A 0\uFF08\u5B64\u5C9B\u533A\uFF09";
            }
          }
          const activeShoe = syncTargetShoeTags();
          const envSfx = g._envSfx !== void 0 ? g._envSfx : rollEnvSfx();
          return {
            player: {
              heart: s.heart,
              stamina: s.stamina,
              cash: s.cash,
              pi: s.pi,
              proximity: s.proximity,
              date: s.date,
              attrs: { str: g.player.str, agi: g.player.agi, nrv: g.player.nrv, int: g.player.int, cha: g.player.cha }
            },
            target: {
              id: g.targetId || "college",
              name: R.targets && R.targets.list && R.targets.list[g.targetId || "college"] ? R.targets.list[g.targetId || "college"].name : "\u72EC\u5C45\u5973\u5927\u5B66\u751F",
              realName: g.targetPersona ? g.targetPersona.name : null,
              persona: g.targetPersona ? JSON.parse(JSON.stringify(g.targetPersona)) : null,
              /* 她的有效属性 = 基底 + 当天身心扰动 + 鞋具修正（每次现算，不依赖 g.target 的中间态） */
              stats: (() => {
                const base = g.targetBase || g.target || {};
                const out = {};
                for (const k of ["str", "agi", "per", "nrv", "social"]) out[k] = base[k];
                const som = g.targetState && g.targetState.somatic && g.targetState.somatic.mod;
                if (som) for (const [k, v] of Object.entries(som)) {
                  if (out[k] !== void 0) out[k] = Math.max(1, out[k] + v);
                }
                return applyShoeMod(out);
              })(),
              alertStage: C.alertStage(s.alert),
              warinessStage: s.wariness >= 60 ? "\u9AD8" : s.wariness >= 30 ? "\u4E2D" : "\u4F4E",
              shoe: activeShoe,
              /* 鞋具读数（状态栏悬停用）：鞋型 + 敏捷修正 + 步声基准 + 按距离折算的当前声级 */
              shoeInfo: (() => {
                const id = (g.tags || []).find((t) => t.owner === "target" && t.id && t.id.startsWith("shoe_"))?.id;
                const def = id && R.tags ? R.tags[id] : null;
                if (!def) return null;
                const base = typeof def.noise === "number" ? def.noise : 1;
                const factor = SHOE_DIST_FACTOR[g.dist] ?? 1;
                return {
                  id: def.id,
                  name: def.name,
                  agi: def.mod && typeof def.mod.agi === "number" ? def.mod.agi : 0,
                  noise: base,
                  distFactor: factor,
                  level: Math.max(0, Math.min(5, Math.round(base * factor)))
                };
              })(),
              state: g.targetState ? JSON.parse(JSON.stringify(g.targetState)) : null
            },
            targetState: g.targetState ? JSON.parse(JSON.stringify(g.targetState)) : null,
            envSfx,
            mode: g.mode,
            dist: g.dist,
            env: g.env,
            slot: g.slot,
            identity: {
              id: g.identity || null,
              name: g.identity && R.identity.list[g.identity] ? R.identity.list[g.identity].name : null,
              shift: identityShift(),
              kit: g.startKit || null
            },
            // v0.8 身份徽记数据源（状态栏常驻条）
            tags: (g.tags || []).map((t) => ({ id: t.id, name: t.name, owner: t.owner, type: t.type || "status", duration: t.duration.type, count: t.duration.count })),
            /* 战术行囊持有物 */
            inventory: (g.player.inventory || []).map((it) => {
              const def = R.items && R.items[it.id] ? R.items[it.id] : { name: it.id, type: "misc", desc: "" };
              return {
                id: it.id,
                name: def.name,
                type: def.type,
                slot: def.slot || null,
                count: it.count || 1,
                equipped: !!it.equipped,
                canEquip: !!(def.slot || def.type === "tool" || def.type === "gear" || def.type === "disguise"),
                canUse: def.type === "consumable",
                desc: def.desc || "",
                effectsDesc: def.effectsDesc || ""
              };
            }),
            /* 状态栏 HUD 动态内容管道接通 */
            herAlert: g.lastHerAlert || (envSfx ? envSfx === "cat" ? "\u{1F431} \u60CA\u52A8\u6697\u5DF7\u91CE\u732B\uFF01\u5783\u573E\u6876\u4F20\u6765\u6293\u6320\u58F0" : "\u{1F415} \u89E6\u52A8\u5EAD\u9662\u72AC\u5420\uFF01\u9662\u5185\u4F20\u6765\u4F4E\u6C89\u4F4E\u543C" : null),
            signal: g.signals && g.signals.length > 0 ? g.signals.slice(-8) : [[g.route && g.route.startTime || "21:00", "\u76EE\u6807\u79BB\u5F00\u539F\u4F4D\uFF0C\u6B65\u5165\u8857\u9053"]],
            proxLog: g.proxLogs && g.proxLogs.length > 0 ? g.proxLogs.slice(-5).reverse() : [],
            assess: g.lastAssess || null,
            ledger: g.lastLedgerSummary || "\u672C\u8F6E\u6682\u65E0\u7ED3\u7B97",
            /* 地图 HUD 字段（状态栏 route-tracker + 战术沙盘） */
            area: districtObj ? districtObj.name : "\u672A\u77E5",
            place: cur && routeView.known[here] ? cur.name : null,
            weather: w.weather,
            weatherName: WEATHER_ICON[w.weather] || "\u{1F319} \u6674\u591C",
            strikeSealed: cur ? !!cur.strike_sealed : false,
            fam: w.district ? g.famSegs[w.district] || 0 : 0,
            route: routeView,
            exits,
            spots: cur ? cur.spots || [] : [],
            sanctuaryAlert,
            /* 相册：计数 + 已拍清单（贴墙渲染用） */
            album: (() => {
              const persona = g.targetPersona || {};
              const shots = Object.entries(g.album || {}).map(([k, v]) => ({ key: k, ...v }));
              return { count: shots.length, total: ALBUM.totalFor(persona), shots };
            })(),
            capture: g.capture || null
          };
        }
        function setRoute(route) {
          g.route = route;
          if (g.targetState && route && route.nodes) {
            const curId = route.nodes[route.here || 0];
            const curName = curId ? map.getPlace(curId)?.name || curId : null;
            const pack = LP.packs && LP.packs[g.targetId] || LP.packs.college || LP.packs.student;
            g.targetState.hand = TS.resolveHand(pack, curId, g.targetState.hand, D.actionSeed(salt, g.floor || 0, "hand_set_route"));
            if (g.targetState.route) {
              g.targetState.route.id = route.id;
              g.targetState.route.note = route.note;
              g.targetState.route.prompt = route.prompt;
              g.targetState.route.here = route.here || 0;
              g.targetState.route.nodes = route.nodes;
              g.targetState.route.currentPlace = curName;
            }
            applyTargetState();
          }
        }
        function herAdvance(quiet) {
          if (g.route && g.route.here < g.route.nodes.length - 1) {
            g.route.here += 1;
            const toId = g.route.nodes[g.route.here];
            const toName = map.getPlace(toId)?.name || toId;
            if (!quiet) {
              g.signals = g.signals || [];
              g.signals.push(["\u79FB\u52A8", `\u76EE\u6807\u52A8\u5411\u63A8\u8FDB\uFF1A\u524D\u5F80 [${toName}]`]);
            }
            if (g.targetState) {
              const pack = LP.packs && LP.packs[g.targetId] || LP.packs.college || LP.packs.student;
              g.targetState.hand = TS.resolveHand(pack, toId, g.targetState.hand, D.actionSeed(salt, g.floor || 0, "hand_adv_" + g.route.here));
              if (g.targetState.route) {
                g.targetState.route.here = g.route.here;
                g.targetState.route.currentPlace = toName;
              }
              applyTargetState();
            }
          }
          if (g.route && g.route.here >= g.route.nodes.length - 1) g.tailing = false;
          return g.route ? g.route.here : -1;
        }
        function alertBranch() {
          const nrv = g.target.nrv || 4, per = g.target.per || 4;
          if (nrv > per) return "turn";
          if (per > nrv) return "detour";
          const roll = D.rollD20(D.actionSeed(salt, g.floor || 1, "alert_branch")).d20;
          return roll <= 7 ? "turn" : roll <= 14 ? "detour" : "shop";
        }
        function applyAlertBehavior(stage) {
          const floor = g.floor || 1;
          const ev = { stage, floor, kind: "", detail: "" };
          if (stage === 1) {
            const roll = D.rollD20(D.actionSeed(salt, floor, "alert_pace")).d20;
            const total = roll + (g.player.agi || 0);
            const dc = R.checks && R.checks.follow || 13;
            ev.kind = "\u63D0\u901F";
            if (total <= dc) {
              const before = g.dist;
              g.dist = DIST_DOWN[g.dist] || "far";
              ev.detail = `\u8DDF\u901F\u5931\u8D25\uFF081d20=${roll}+\u654F\u6377${g.player.agi} \u2264 DC${dc}\uFF09\uFF1A\u8DDD\u79BB\u7531${DIST_CN[before]}\u9000\u5230${DIST_CN[g.dist]}`;
            } else {
              ev.detail = `\u8DDF\u901F\u6210\u529F\uFF081d20=${roll}+\u654F\u6377${g.player.agi} > DC${dc}\uFF09\uFF1A\u7EF4\u6301${DIST_CN[g.dist]}`;
            }
            g.lastHerAlert = "\u26A0\uFE0F \u5979\u7684\u6B65\u9891\u53D8\u4E86\u2014\u2014\u7A81\u7136\u52A0\u5FEB\uFF0C\u624B\u4F38\u8FDB\u5305\u91CC\u6478\u624B\u673A\u3002";
          } else if (stage === 2) {
            const branch = alertBranch();
            if (branch === "turn") {
              ev.kind = "\u9AA4\u505C\u56DE\u5934";
              if (g.dist === "close" || g.dist === "touch") {
                const her = D.rollD20(D.actionSeed(salt, floor, "alert_turn_her")).d20 + targetEffectiveAcuity();
                const me = D.rollD20(D.actionSeed(salt, floor, "alert_turn_me")).d20 + (g.player.agi || 0);
                if (me >= her) {
                  L.commit({ alert: -5 }, { reason: "alert_turn" });
                  ev.detail = `\u5979\u56DE\u5934\u626B\u8857\uFF0C\u4F60\u8D34\u8FDB\u9634\u5F71\uFF08${me} \u2265 ${her}\uFF09\uFF1A\u5979\u6CA1\u770B\u6E05\uFF0C\u8B66\u89C9 -5`;
                } else {
                  L.commit({ alert: 8, faceMem: 2 }, { reason: "alert_seen" });
                  ev.detail = `\u5979\u56DE\u5934\u6B63\u597D\u649E\u4E0A\u4F60\u7684\u89C6\u7EBF\uFF08${me} < ${her}\uFF09\uFF1A\u9762\u5BB9\u8BB0\u5FC6 +2\u3001\u8B66\u89C9 +8`;
                }
              } else {
                L.commit({ alert: -3 }, { reason: "alert_turn" });
                ev.detail = "\u5979\u505C\u4E0B\u56DE\u5934\u626B\u4E86\u4E00\u773C\u8857\u9762\uFF0C\u4EC0\u4E48\u4E5F\u6CA1\u770B\u5230\uFF08\u8B66\u89C9 -3\uFF09";
              }
              g.lastHerAlert = "\u26A0\uFE0F \u5979\u7A81\u7136\u505C\u6B65\uFF0C\u56DE\u5934\u626B\u4E86\u4E00\u773C\u8EAB\u540E\u3002";
            } else if (branch === "detour") {
              ev.kind = "\u7ED5\u6B7B\u8DEF";
              const before = g.dist;
              herAdvance(true);
              g.dist = DIST_DOWN[g.dist] || "far";
              ev.detail = `\u5979\u62D0\u8FDB\u4E00\u6761\u5C94\u8DEF\uFF0C\u8DDD\u79BB\u7531${DIST_CN[before]}\u9000\u5230${DIST_CN[g.dist]}\u2014\u2014\u8DDF\u4E0D\u8DDF\uFF0C\u4F60\u81EA\u5DF1\u51B3\u5B9A`;
              g.lastHerAlert = "\u26A0\uFE0F \u5979\u6CA1\u6709\u76F4\u8D70\uFF0C\u62D0\u8FDB\u4E86\u4E00\u6761\u66F4\u6697\u7684\u5C94\u8DEF\u3002";
            } else {
              ev.kind = "\u8FDB\u5E97";
              g.alertHold = Math.max(g.alertHold || 0, 1);
              ev.detail = "\u5979\u62D0\u8FDB\u8DEF\u8FB9\u4FBF\u5229\u5E97\uFF0C\u73BB\u7483\u95E8\u5728\u8EAB\u540E\u5408\u4E0A\uFF08\u5979\u4F1A\u5728\u91CC\u9762\u505C\u4E00\u697C\uFF09";
              g.lastHerAlert = "\u26A0\uFE0F \u5979\u63A8\u95E8\u8FDB\u4E86\u4FBF\u5229\u5E97\uFF0C\u9694\u7740\u73BB\u7483\u95E8\u8FD8\u5728\u770B\u8857\u4E0A\u3002";
            }
          } else if (stage === 3) {
            ev.kind = "\u5F00\u8DD1";
            g.fleeing = true;
            ev.detail = "\u5979\u786E\u4FE1\u88AB\u8DDF\u4E86\uFF0C\u5F00\u59CB\u5C0F\u8DD1\uFF08\u6B64\u540E\u6BCF\u697C\u5979\u90FD\u4F1A\u5F80\u524D\u8D70\u4E00\u7AD9\uFF09";
            g.lastHerAlert = "\u203C\uFE0F \u5979\u56DE\u5934\u770B\u4E86\u4F60\u4E00\u773C\uFF0C\u7136\u540E\u62D4\u817F\u5C31\u8DD1\u3002";
          } else {
            ev.kind = "\u644A\u724C";
            g.tailing = false;
            ev.detail = "\u5979\u5C16\u53EB\u7740\u51B2\u5411\u8DEF\u4EBA\u2014\u2014\u4ECA\u665A\u5230\u6B64\u4E3A\u6B62\uFF0C\u4F60\u53EA\u80FD\u64A4";
            g.lastHerAlert = "\u203C\uFE0F \u5979\u5C16\u53EB\u51FA\u58F0\uFF0C\u51B2\u5411\u4E86\u6709\u4EBA\u7684\u5730\u65B9\u3002";
          }
          g.alertEvent = ev;
          log(`[\u8FC7\u6863] ${ev.kind}\uFF1A${ev.detail}`);
          g.signals = g.signals || [];
          g.signals.push(["\u7A81\u53D1", `\u5979${ev.kind}\uFF1A${ev.detail}`]);
          if (g.signals.length > 20) g.signals.shift();
        }
        function resolveAlertCross() {
          g.alertLatch = g.alertLatch || [];
          for (let guard = 0; guard < 4; guard++) {
            const stage = C.alertStage(L.get("alert"));
            const max = g.alertLatch.length ? Math.max(...g.alertLatch) : 0;
            if (stage <= max) return;
            for (let s = max + 1; s < stage; s++) g.alertLatch.push(s);
            g.alertLatch.push(stage);
            applyAlertBehavior(stage);
          }
        }
        function routeClockMin(floor) {
          const start = g.route && g.route.startTime ? String(g.route.startTime) : "";
          const m = start.match(/^(\d{1,2}):(\d{2})$/);
          const base = m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 21 * 60;
          return base + Math.max(0, (floor || 1) - 1) * 15;
        }
        function hhmmToMin(t) {
          const s = String(t || "").replace(":", "");
          if (!/^\d{3,4}$/.test(s)) return null;
          const v = s.padStart(4, "0");
          return parseInt(v.slice(0, 2), 10) * 60 + parseInt(v.slice(2), 10);
        }
        function fmtMin(min) {
          const h = Math.floor(min / 60) % 24;
          return `${String(h).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
        }
        function advanceRouteByClock() {
          const r = g.route;
          if (!r || !Array.isArray(r.nodes) || !Array.isArray(r.times) || !r.times.length) return r ? r.here || 0 : -1;
          if (g.alertHold > 0) {
            g.alertHold -= 1;
            return r.here || 0;
          }
          const now = routeClockMin(g.floor || 1);
          const from = r.here || 0;
          while (r.here < r.nodes.length - 1) {
            const t = hhmmToMin(r.times[r.here + 1]);
            if (t === null || t > now) break;
            herAdvance(true);
          }
          if (r.here > from) {
            const toName = map.getPlace(r.nodes[r.here])?.name || r.nodes[r.here];
            g.signals = g.signals || [];
            g.signals.push([fmtMin(now), `\u76EE\u6807\u52A8\u5411\u63A8\u8FDB\uFF1A\u524D\u5F80 [${toName}]`]);
            if (g.signals.length > 20) g.signals.shift();
          }
          return r.here;
        }
        function revealNode(i) {
          if (g.route && g.route.known && i >= 0 && i < g.route.known.length) g.route.known[i] = 1;
        }
        function nightFall() {
          if (g.tailing) {
            const atEnd = g.route && g.route.here >= g.route.nodes.length - 1;
            if (!atEnd) return { blocked: true, reason: "\u804C\u4E1A\u75C5\uFF1A\u8DDF\u7F00\u672A\u7ED3\u675F\uFF0C\u4ECA\u665A\u53EA\u80FD\u8DDF\u4E22\u6216\u8DDF\u5979\u5230\u5BB6" };
          }
          const curDate = L.get("date");
          if (g.route && g.route.id === "saturday_date_hotel") {
            g.hotelVisitedCount = (g.hotelVisitedCount || 0) + 1;
            g.lastHotelDate = curDate;
          }
          const r = L.settleNight({ peakAlert: L.get("alert"), nrv: g.player.nrv, staminaMax: g.player.staminaMax });
          (g.tags || (g.tags = [])).length ? T.clearNight(g.tags) && (g.tags = T.clearNight(g.tags)) : null;
          syncHeartTags();
          g.consecFails = 0;
          const mult = g.identity && R.identity.list[g.identity] && R.identity.list[g.identity].piMult || 1;
          let piBonus = 0;
          if (mult > 1 && g.nightPiGross > 0) {
            piBonus = Math.round(g.nightPiGross * (mult - 1));
            if (piBonus > 0) {
              L.commit({ pi: piBonus }, { reason: "identity_pi" });
              log(`[\u8EAB\u4EFD] PI\xD7${mult}\uFF1A\u5F53\u665A\u6BDB\u5165\u8D26 ${g.nightPiGross}\uFF0C\u8865\u5DEE +${piBonus}`);
            }
          }
          g.nightPiGross = 0;
          g.tailing = false;
          g.nightDrinkUsed = false;
          g.alertLatch = [];
          g.alertEvent = null;
          g.alertHold = 0;
          g.fleeing = false;
          const wd = D.rollD20(D.actionSeed(salt, 9e3 + (g.floor || 0), "weather")).d20;
          g.world.weather = wd <= WEATHER_BANDS.clear[1] ? "clear" : wd <= WEATHER_BANDS.rain[1] ? "rain" : "storm";
          const nextDate = L.get("date");
          const dayOfWeek = ((nextDate || 1) - 1) % 7 + 1;
          const pack = LP.packs && LP.packs[g.targetId] || LP.packs.college || LP.packs.student;
          const isLimping = TS.isLimpingDate(nextDate, g.lastHotelDate);
          if (dayOfWeek === 6 && (pack.id === "student" || pack.id === "college")) {
            const routine = g.targetPersona?.saturdayRoutine || (g.targetPersona ? g.targetPersona.saturdayRoutine = TS.resolveSaturdayRoutine(pack, g.targetPersona, D.actionSeed(salt, 0, "saturday_routine")) : "cram");
            if (routine === "date") {
              g.dateCount = (g.dateCount || 0) + 1;
            }
            const personalityId = g.targetPersona?.personality?.id || g.targetPersona?.personality || "timid";
            const routeDef = TS.resolveSaturdayRoute(pack, routine, g.dateCount || 0, personalityId, D.actionSeed(salt, nextDate, "saturday_route_branch"), { hotelVisitedCount: g.hotelVisitedCount || 0 });
            if (routeDef) {
              const startT = routeDef.path && routeDef.path[0] && routeDef.path[0].t ? `${routeDef.path[0].t.slice(0, 2)}:${routeDef.path[0].t.slice(2)}` : "21:00";
              g.route = {
                id: routeDef.id,
                note: routeDef.note,
                prompt: routeDef.prompt,
                startTime: startT,
                nodes: routeDef.path.map((p) => p.place),
                times: routeDef.path.map((p) => p.t),
                here: 0,
                known: routeDef.known || routeDef.path.map(() => 1)
              };
            }
          } else if (dayOfWeek === 7 && (pack.id === "student" || pack.id === "college")) {
            const sundayRoute = (pack.routes || []).find((r2) => r2.id === "sunday_rest") || {
              id: "sunday_rest",
              note: "\u5468\u65E5\u5168\u5929\u5C45\u5BB6\u4F11\u6574\uFF08\u4E0D\u51FA\u95E8\uFF09",
              prompt: "\u767D\u63CF\u5C11\u5973\u5468\u65E5\u5168\u5929\u5728\u5BD3\u6240\u5185\u5B89\u9759\u4F11\u6574\uFF0C\u7A97\u5E18\u62C9\u8D77\uFF0C\u672A\u66FE\u5916\u51FA\uFF0C\u8857\u9053\u4E0A\u65E0\u5176\u8DB3\u8FF9",
              path: [{ place: "unit_stairs_b", t: "2000" }]
            };
            g.route = {
              id: sundayRoute.id,
              note: sundayRoute.note,
              prompt: sundayRoute.prompt,
              startTime: "20:00",
              nodes: sundayRoute.path.map((p) => p.place),
              times: sundayRoute.path.map((p) => p.t),
              here: 0,
              known: [1]
            };
            g.tailing = false;
          } else if (dayOfWeek >= 1 && dayOfWeek <= 5 && (pack.id === "student" || pack.id === "college")) {
            let routeDef = null;
            if (dayOfWeek === 5) {
              routeDef = pack.routes.find((r2) => r2.id === "friday_late" || r2.id === "college_friday_night");
            }
            if (!routeDef) {
              routeDef = pack.routes.find((r2) => r2.id === "college_evening" || r2.id === "workday_evening") || pack.routes[0];
            }
            if (routeDef) {
              const startT = routeDef.path && routeDef.path[0] && routeDef.path[0].t ? `${routeDef.path[0].t.slice(0, 2)}:${routeDef.path[0].t.slice(2)}` : "21:00";
              g.route = {
                id: routeDef.id,
                note: routeDef.note,
                prompt: routeDef.prompt,
                startTime: startT,
                nodes: routeDef.path.map((p) => p.place),
                times: routeDef.path.map((p) => p.t),
                here: 0,
                known: routeDef.known || routeDef.path.map(() => 1)
              };
            }
          }
          const outfit = TS.sampleOutfit(pack, nextDate, D.actionSeed(salt, nextDate, "outfit"), g.targetPersona || g.target);
          const somatic = TS.sampleSomatic(pack, D.actionSeed(salt, nextDate, "somatic"), { isLimping });
          const startPlaceId = g.route && g.route.nodes ? g.route.nodes[0] : null;
          const startPlaceName = startPlaceId ? map.getPlace(startPlaceId)?.name || startPlaceId : null;
          const hand = TS.resolveHand(pack, startPlaceId, null, D.actionSeed(salt, 9e3 + (g.floor || 0), "hand_night"));
          g.targetState = {
            outfit,
            somatic,
            hand,
            route: g.route ? {
              id: g.route.id,
              note: g.route.note,
              prompt: g.route.prompt,
              startTime: g.route.startTime,
              here: g.route.here || 0,
              nodes: g.route.nodes,
              currentPlace: startPlaceName
            } : null
          };
          applyTargetState();
          return { seq: r.seq, warinessGain: r.warinessGain, nextStartAlert: r.nextStartAlert, date: L.get("date"), nextWeather: g.world.weather, piBonus, targetState: g.targetState };
        }
        function gmSet(changes = {}) {
          const { tailing, ...rest } = changes;
          if (tailing !== void 0) g.tailing = !!tailing;
          return L.commit(rest, { reason: "gm" });
        }
        function save() {
          return {
            v: 1,
            sessionSalt: salt,
            player: { ...g.player },
            target: { ...g.target },
            targetBase: { ...g.targetBase },
            targetId: g.targetId || "ol",
            targetPersona: g.targetPersona ? JSON.parse(JSON.stringify(g.targetPersona)) : null,
            targetState: g.targetState ? JSON.parse(JSON.stringify(g.targetState)) : null,
            dateCount: g.dateCount || 0,
            hotelVisitedCount: g.hotelVisitedCount || 0,
            lastHotelDate: g.lastHotelDate || null,
            inventory: JSON.parse(JSON.stringify(g.player.inventory || [])),
            nightDrinkUsed: !!g.nightDrinkUsed,
            mode: g.mode,
            dist: g.dist,
            env: g.env,
            slot: g.slot,
            world: { ...g.world },
            route: g.route ? JSON.parse(JSON.stringify(g.route)) : null,
            famSegs: { ...g.famSegs },
            tags: JSON.parse(JSON.stringify(g.tags || [])),
            identity: g.identity || null,
            tailing: !!g.tailing,
            nightPiGross: g.nightPiGross || 0,
            startKit: g.startKit || null,
            proxLogs: JSON.parse(JSON.stringify(g.proxLogs || [])),
            signals: JSON.parse(JSON.stringify(g.signals || [])),
            lastAssess: g.lastAssess || null,
            lastHerAlert: g.lastHerAlert || null,
            lastLedgerSummary: g.lastLedgerSummary || null,
            floor: g.floor || 0,
            consecFails: g.consecFails,
            alertLatch: (g.alertLatch || []).slice(),
            alertEvent: g.alertEvent || null,
            alertHold: g.alertHold || 0,
            fleeing: !!g.fleeing,
            album: JSON.parse(JSON.stringify(g.album || {})),
            setBonusDone: JSON.parse(JSON.stringify(g.setBonusDone || {})),
            captureSeq: g.captureSeq || 0,
            tickets: JSON.parse(JSON.stringify(g.tickets)),
            ticketsIssued: g.ticketsIssued,
            ledgerState: { ...L.state }
          };
        }
        return {
          processFloor,
          settleInput,
          processReply,
          translateInput,
          nightFall,
          gmSet,
          snapshot,
          save,
          ledger: L,
          capturePhoto,
          albumTotal: () => ALBUM.totalFor(g.targetPersona || {}),
          setRoute,
          herAdvance,
          advanceRouteByClock,
          revealNode,
          addItem,
          removeItem,
          equipItem,
          unequipItem,
          useItem,
          get mode() {
            return g.mode;
          },
          get dist() {
            return g.dist;
          },
          get targetState() {
            return g.targetState;
          },
          initTargetState,
          applyTargetState,
          _g: g
        };
      }
      module.exports = { createGame };
    }
  });

  // src/host/glue.js
  var require_glue = __commonJS({
    "src/host/glue.js"(exports, module) {
      var { createGame } = require_game();
      var LP = require_lifepack();
      var R = require_rules();
      var VAR_SAVE = "wx_save";
      var VAR_SNAP = "wx_snap";
      var VAR_INIT = "wx_init";
      var VAR_CONF = "wx_conf";
      var BAND_CN = { success: "\u6210\u529F", grace: "\u52C9\u5F3A", fail: "\u5931\u8D25", nat1: "\u5929\u71361", nat20: "\u5927\u6210\u529F" };
      function hostFrames() {
        const list = [];
        try {
          let w = typeof window !== "undefined" ? window : null;
          while (w && list.length < 8 && !list.includes(w)) {
            list.push(w);
            let p = null;
            try {
              p = w.parent;
            } catch (e) {
              p = null;
            }
            if (!p || p === w) break;
            w = p;
          }
        } catch (e) {
        }
        if (typeof globalThis !== "undefined" && !list.includes(globalThis)) list.push(globalThis);
        return list;
      }
      function findTavernHelper() {
        for (const w of hostFrames()) {
          try {
            if (w && w.TavernHelper) return w.TavernHelper;
          } catch (e) {
          }
        }
        try {
          return typeof TavernHelper !== "undefined" ? TavernHelper : null;
        } catch (e) {
          return null;
        }
      }
      function detectApi() {
        const frames = hostFrames();
        const pick = (name) => {
          for (const w of frames) {
            try {
              if (w && typeof w[name] === "function") return w[name].bind(w);
            } catch (e) {
            }
            try {
              const th = w && w.TavernHelper;
              if (th && typeof th[name] === "function") return th[name].bind(th);
            } catch (e) {
            }
          }
          return null;
        };
        const holder = (() => {
          for (const w of frames) {
            try {
              if (w && typeof w.insertOrAssignVariables === "function" && typeof w.getVariables === "function") return w;
            } catch (e) {
            }
            try {
              const th = w && w.TavernHelper;
              if (th && typeof th.insertOrAssignVariables === "function" && typeof th.getVariables === "function") return th;
            } catch (e) {
            }
          }
          return null;
        })();
        const vars = {
          has: !!holder,
          read: async () => holder ? await holder.getVariables({ type: "chat" }) || {} : {},
          assign: async (obj) => {
            if (holder) await holder.insertOrAssignVariables(obj, { type: "chat" });
          }
        };
        const onEvent = (name, fn) => {
          for (const w of frames) {
            try {
              if (typeof w.eventOn === "function" && w.tavern_events && w.tavern_events[name]) {
                w.eventOn(w.tavern_events[name], fn);
                return true;
              }
            } catch (e) {
            }
            try {
              const th = w.TavernHelper;
              if (th && typeof th.eventOn === "function" && th.tavern_events && th.tavern_events[name]) {
                th.eventOn(th.tavern_events[name], fn);
                return true;
              }
            } catch (e) {
            }
            try {
              if (w.eventSource && typeof w.eventSource.on === "function") {
                w.eventSource.on(String(name).toLowerCase(), fn);
                return true;
              }
            } catch (e) {
            }
          }
          return false;
        };
        const getChatMessages = pick("getChatMessages");
        let readLast = null;
        if (getChatMessages) {
          readLast = async () => {
            try {
              const list = await getChatMessages(-1);
              return Array.isArray(list) ? list[list.length - 1] : list;
            } catch (e) {
              return null;
            }
          };
        }
        const readById = async (id) => {
          if (!getChatMessages) return null;
          const last = (arr) => Array.isArray(arr) ? arr[arr.length - 1] || null : arr || null;
          if (Number.isInteger(id) && id >= 0) {
            try {
              const m = last(await getChatMessages(id));
              if (m && (m.mes ?? m.content ?? m.message)) return m;
            } catch (e) {
            }
          }
          try {
            const m = last(await getChatMessages(-1));
            if (m && (m.mes ?? m.content ?? m.message)) return m;
          } catch (e) {
          }
          await new Promise((r) => setTimeout(r, 120));
          try {
            const m = last(await getChatMessages(-1));
            if (m) return m;
          } catch (e) {
          }
          return null;
        };
        const findCtx = () => {
          for (const w of frames) {
            try {
              const st = w && w.SillyTavern;
              if (!st || typeof st.getContext !== "function") continue;
              const ctx = st.getContext();
              if (ctx && typeof ctx.setExtensionPrompt === "function") return ctx;
            } catch (e) {
            }
          }
          return null;
        };
        const POS_HELPER = { 0: "in_prompt", 1: "in_chat", 2: "none" };
        const ROLE_HELPER = { 0: "system", 1: "user", 2: "assistant" };
        const injectPrompts = async (blocks) => {
          const arr = Array.isArray(blocks) ? blocks : [blocks];
          const helperInject = pick("injectPrompts");
          if (helperInject) {
            try {
              await helperInject(arr.map((b) => ({
                id: b.id,
                position: POS_HELPER[b.position] || "in_chat",
                depth: Number.isFinite(b.depth) ? b.depth : 1,
                role: ROLE_HELPER[b.role] || "system",
                content: b.content
              })));
              return { mode: "tavernhelper", verified: null };
            } catch (e) {
            }
          }
          const ctx = findCtx();
          if (!ctx) return null;
          let sent = 0;
          let verified = null;
          for (const b of arr) {
            const pos = Number.isFinite(b.position) ? b.position : 1;
            const depth = Number.isFinite(b.depth) ? b.depth : 1;
            const role = Number.isFinite(b.role) ? b.role : 0;
            try {
              ctx.setExtensionPrompt(b.id, b.content, pos, depth, false, role);
              sent++;
            } catch (e) {
              continue;
            }
            try {
              const bag = ctx.extension_prompts || ctx.extensionPrompts;
              if (bag && typeof bag === "object") {
                const slot = bag[b.id];
                const got = slot && (slot.value !== void 0 ? slot.value : slot.content);
                if (got !== void 0) verified = got === b.content;
              }
            } catch (e) {
            }
          }
          return sent ? { mode: "native", verified } : null;
        };
        const uninjectPrompts = (ids) => {
          const arr = Array.isArray(ids) ? ids : [ids];
          const helperUninject = pick("uninjectPrompts");
          if (helperUninject) {
            try {
              Promise.resolve(helperUninject(arr)).catch(() => {
              });
            } catch (e) {
            }
          }
          const ctx = findCtx();
          if (ctx) {
            for (const id of arr) {
              try {
                ctx.setExtensionPrompt(id, "", 1, 1, false, 0);
              } catch (e) {
              }
            }
          }
        };
        return {
          vars,
          onEvent,
          readLast,
          readById,
          injectPrompts,
          uninjectPrompts,
          generate: pick("generate"),
          stopAllGeneration: pick("stopAllGeneration")
        };
      }
      function extractLlmText(msg) {
        if (!msg) return "";
        if (typeof msg === "string") return msg;
        const m = msg.message ?? msg;
        if (typeof m === "string") return m;
        return String((m && (m.mes ?? m.content ?? m.message)) ?? "");
      }
      function defaultInit(overrides = {}) {
        const targetId = overrides && overrides.targetId || "college";
        const targetPersona = overrides && overrides.targetPersona || null;
        const pack = LP.packs && LP.packs[targetId];
        const targetDef = R.targets && R.targets.list && R.targets.list[targetId] || R.targets && R.targets.list && R.targets.list.student;
        let route = null;
        if (pack && pack.routes) {
          const evening = pack.routes.find((r) => r.id === "college_evening" || r.id === "workday_evening") || pack.routes[0];
          if (evening) {
            const startT = evening.path && evening.path[0] && evening.path[0].t ? `${evening.path[0].t.slice(0, 2)}:${evening.path[0].t.slice(2)}` : "21:00";
            route = {
              id: evening.id,
              note: evening.note || "",
              prompt: evening.prompt || "",
              startTime: startT,
              nodes: evening.path.map((s) => s.place),
              times: evening.path.map((s) => s.t),
              known: evening.path.map(() => 1),
              here: 0
            };
          }
        } else {
          const fallbackPack = LP.packs.student || LP.packs.college;
          const evening = fallbackPack.routes.find((r) => r.id === "workday_evening") || fallbackPack.routes[0];
          route = evening ? {
            id: evening.id,
            note: evening.note || "",
            prompt: evening.prompt || "",
            startTime: "21:00",
            nodes: evening.path.map((s) => s.place),
            times: evening.path.map((s) => s.t),
            known: evening.path.map(() => 1),
            here: 0
          } : null;
        }
        let targetStats = pack ? { ...pack.stats, social: pack.social } : { ...targetDef.stats || { str: 3, agi: 4, per: 5, nrv: 4 }, social: targetDef.social || 2 };
        if (targetPersona && targetPersona.finalStats) {
          targetStats = Object.assign(targetStats, targetPersona.finalStats);
        }
        let district = "B";
        if (targetId === "club") district = "C";
        else if (targetId === "wife") district = "D";
        return {
          targetId,
          targetPersona,
          player: { str: 3, agi: 5, nrv: 5, int: 5, cha: 2, staminaMax: 115 },
          target: targetStats,
          stats: { date: 1, heart: 30, stamina: 100, cash: 800, pi: 0 },
          world: { weather: "clear", district },
          route
        };
      }
      function receiptText(r) {
        const lines = [`\u3010\u7B2C${r.floor}\u697C \xB7 \u4E2D\u63A7\u7ED3\u7B97\u56DE\u6267\uFF08\u552F\u4E00\u6570\u503C\u771F\u6E90\uFF09\u3011`];
        const st = r.stats || r.package && r.package.stats || {};
        const pkg = r.package || {};
        const ts = pkg.targetState || st.targetState;
        const startT = ts && ts.route && ts.route.startTime || st.route && st.route.startTime;
        let hh = 21;
        let mm = "15";
        if (startT && typeof startT === "string" && startT.includes(":")) {
          const parts = startT.split(":");
          const baseH = parseInt(parts[0], 10) || 21;
          const baseM = parseInt(parts[1], 10) || 0;
          const totalM = baseM + Math.max(0, (r.floor || 1) - 1) * 15;
          hh = baseH + Math.floor(totalM / 60);
          mm = (totalM % 60).toString().padStart(2, "0");
        } else {
          const timeMin = (r.floor || 1) * 15 % 120;
          hh = 21 + Math.floor(timeMin / 60);
          mm = (timeMin % 60).toString().padStart(2, "0");
        }
        const timeStr = `\u5468\u4E09 ${hh}:${mm}`;
        const weatherKey = st.world && st.world.weather || "clear";
        const weatherDesc = {
          clear: "\u79CB\u672B\u6674\u591C\uFF08\u5E72\u71E5\u6E05\u51B7\uFF0C\u8857\u706F\u901A\u660E\uFF09",
          rain: "\u79CB\u672B\u51B7\u96E8\u591C\uFF08\u5730\u9762\u6E7F\u6ED1\uFF0C\u6CA5\u9752\u53CD\u5149\uFF0C\u96E8\u4F1E\u906E\u853D\u89C6\u7EBF\uFF09",
          storm: "\u79CB\u672B\u66B4\u96E8\u591C\uFF08\u72C2\u98CE\u66B4\u96E8\uFF0C\u79EF\u6C34\u6F2B\u6EA2\uFF0C\u89C6\u7EBF\u53D7\u9650\uFF09",
          fog: "\u79CB\u672B\u591C\u96FE\uFF08\u6D53\u96FE\u5F25\u6F2B\uFF0C\u80FD\u89C1\u5EA6\u4F4E\uFF0C\u58F0\u54CD\u6C89\u95F7\uFF09"
        }[weatherKey] || "\u79CB\u672B\u51B7\u96E8\u591C\uFF08\u5730\u9762\u6E7F\u6ED1\u6CA5\u9752\u53CD\u5149\uFF09";
        const modeKey = st.mode || "stealth";
        const modeDesc = {
          stealth: "\u6F5C\u884C\u8DDF\u7F00\uFF08\u660E\u6697\u9694\u79BB\u6001\uFF0C\u76EE\u6807\u672A\u5BDF\u89C9\u6B63\u9762\u5B58\u5728\uFF0C\u4E0D\u53EF\u5F53\u9762\u5BF9\u8BDD\uFF09",
          contact: "\u63A5\u89E6\u6500\u8C08\uFF08\u6B63\u9762\u76F8\u5BF9\u6001\uFF0C\u53EF\u5C55\u5F00\u8A00\u8BED\u4EA4\u6D41\uFF09",
          lock: "\u95E8\u9501\u535A\u5F08\uFF08\u4E13\u6CE8\u9501\u5177\u7269\u7406\u4EA4\u4E92\uFF09",
          endgame: "\u7EC8\u5C40\u63A7\u5236\uFF08\u8EAB\u4F53\u5BF9\u6297\u4E0E\u675F\u7F1A\uFF09"
        }[modeKey] || "\u6F5C\u884C\u8DDF\u7F00";
        const distKey = st.dist || "same";
        const distDesc = {
          far: "\u8FDC\u7AEF\uFF08\u7EA630\u7C73\u4EE5\u4E0A\uFF0C\u4EC5\u80FD\u8FA8\u522B\u8EAB\u5F62\u8F6E\u5ED3\uFF0C\u4E0D\u53EF\u611F\u77E5\u5FAE\u8868\u60C5\uFF09",
          same: "\u540C\u8857\uFF08\u7EA615-20\u7C73\uFF0C\u5FC5\u987B\u4F9D\u6258\u6CBF\u8857\u969C\u788D\u906E\u853D\uFF0C\u4E25\u7981\u8FD1\u8EAB\u89E6\u78B0\uFF09",
          street: "\u540C\u8857\uFF08\u7EA615-20\u7C73\uFF0C\u5FC5\u987B\u4F9D\u6258\u6CBF\u8857\u969C\u788D\u906E\u853D\uFF0C\u4E25\u7981\u8FD1\u8EAB\u89E6\u78B0\uFF09",
          close: "\u8EAB\u540E\uFF08\u7EA63-5\u7C73\uFF0C\u811A\u6B65\u58F0\u4E0E\u8EAB\u5F62\u6E05\u6670\uFF0C\u9AD8\u5371\u6212\u5907\u533A\uFF09",
          behind: "\u8EAB\u540E\uFF08\u7EA63-5\u7C73\uFF0C\u811A\u6B65\u58F0\u4E0E\u8EAB\u5F62\u6E05\u6670\uFF0C\u9AD8\u5371\u6212\u5907\u533A\uFF09",
          touch: "\u8D34\u8EAB\uFF081\u7C73\u4EE5\u5185\uFF0C\u53EF\u53CA\u80A2\u4F53\u4E0E\u547C\u5438\u58F0\uFF09"
        }[distKey] || "\u540C\u8857\uFF08\u7EA615-20\u7C73\uFF09";
        const sanc = st.sanctuaryAlert ? `\uFF5C\u9003\u9038\u5411\u5BFC\uFF1A${st.sanctuaryAlert}` : "";
        const placeName = ts && ts.route && ts.route.currentPlace || st.place || null;
        const placeStr = placeName ? `\u5730\u70B9\uFF1A[${placeName}]\uFF5C` : "";
        lines.push(`[\u65F6\u7A7A\u4E0E\u73AF\u5883] \u65F6\u95F4\uFF1A${timeStr}\uFF5C${placeStr}\u73AF\u5883\uFF1A${weatherDesc}`);
        lines.push(`[\u7AD9\u4F4D\u4E0E\u6A21\u5F0F] \u4EA4\u4E92\u6A21\u5F0F\uFF1A${modeDesc}\uFF5C\u76F8\u5BF9\u8DDD\u79BB\uFF1A${distDesc}${sanc}`);
        if (pkg.narrativeOnly) {
          lines.push("\u672C\u8F6E\u73A9\u5BB6\u672A\u70B9\u9009\u4EFB\u4F55\u52A8\u4F5C\u80F6\u56CA\uFF1A\u7EAF\u53D9\u4E8B\u63A8\u8FDB\uFF0C\u4E0D\u5F97\u51ED\u7A7A\u53D1\u751F\u68C0\u5B9A\u6216\u4F53\u529B/\u5FC3\u8DF3/\u8B66\u89C9\u53D8\u52A8\u3002");
        } else if (pkg.actions && pkg.actions.length) {
          lines.push("[\u52A8\u4F5C\u88C1\u51B3]");
          for (const a of pkg.actions) {
            const actName = a.label || a.name;
            if (a.rejected) {
              lines.push(`- ${actName}\uFF1A\u672A\u6267\u884C\uFF08${a.reason || "\u5F53\u524D\u6761\u4EF6\u4E0D\u6EE1\u8DB3"}\uFF09`);
              continue;
            }
            if (a.noRoll) {
              lines.push(`- ${actName}\uFF1A${a.text || "\u5B8C\u6210\uFF08\u65E0\u68C0\u5B9A\uFF09"}`);
              continue;
            }
            const isFail = a.band === "fail" || a.band === "crit_fail";
            const bandStr = BAND_CN[a.band] || (isFail ? "\u672A\u8FBE\u6210" : "\u8FBE\u6210");
            let detail = a.text || "";
            if (isFail && !detail) {
              if (actName.includes("\u6F5C\u884C") || actName.includes("\u85CF\u533F")) detail = "\u8E29\u4E2D\u79EF\u6C34\u6216\u788E\u6742\u7269\u5F15\u53D1\u7EC6\u5FAE\u52A8\u9759\uFF0C\u5F15\u8D77\u53CD\u5149\u6CE8\u610F";
              else if (actName.includes("\u62CD\u7167") || actName.includes("\u6253\u91CF") || actName.includes("\u89C2\u5BDF")) detail = "\u89C6\u7EBF\u88AB\u96E8\u4F1E\u4E0E\u884C\u4EBA\u7269\u4EF6\u906E\u6321\uFF0C\u89D2\u5EA6\u4E0D\u4F73";
              else if (actName.includes("\u9501") || actName.includes("\u64AC")) detail = "\u9501\u82AF\u9508\u6B7B\u5361\u6DA9\uFF0C\u53D1\u51FA\u91D1\u5C5E\u78B0\u649E\u8106\u54CD";
              else detail = "\u53D7\u9650\u4E8E\u73B0\u573A\u73AF\u5883\u7A81\u53D1\u5E72\u6270\uFF0C\u52A8\u4F5C\u53D7\u963B";
            }
            lines.push(`- ${actName}\uFF1A${bandStr}${detail ? "\uFF08" + detail + "\uFF09" : ""}`);
          }
        }
        if (pkg.alertEvent) {
          lines.push(`- \u5979\u7684\u8FC7\u6863\u53CD\u5E94\uFF1A${pkg.alertEvent.kind}\uFF08${pkg.alertEvent.detail}\uFF09`);
        }
        if (pkg.capture) {
          const cn = { front: "\u6B63\u9762", side: "\u4FA7\u9762", back: "\u80CC\u9762", "three-quarter": "\u659C\u4FA7" };
          const al = pkg.stats && pkg.stats.album ? pkg.stats.album : null;
          lines.push(`- \u62CD\u7167\u6210\u679C\uFF1A${pkg.capture.name} \xB7 ${cn[pkg.capture.angle] || pkg.capture.angle}` + (al ? `\uFF08\u76F8\u518C ${al.count}/${al.total}\uFF09` : "") + `\uFF1BPI +${pkg.capture.piBonus}`);
        }
        const fails = (pkg.actions || []).filter((a) => a.band === "fail" || a.band === "crit_fail");
        if (fails.length) {
          const failNames = fails.map((a) => a.label || a.name).join("\u3001");
          lines.push(`\u3010\u53D9\u4E8B\u65AD\u70B9\u539F\u5219\u3011\uFF1A\u73A9\u5BB6\u8F93\u5165\u7684\u5185\u5BB9\u4EC5\u4E3A\u5176\u201C\u4E3B\u89C2\u9884\u60F3\u4E0E\u52A8\u4F5C\u5C1D\u8BD5\u201D\u3002\u5224\u5B9A\u4E3A\u672A\u8FBE\u6210\uFF08${failNames} \u5931\u8D25/\u610F\u5916\uFF09\uFF0C\u73A9\u5BB6\u63CF\u5199\u7684\u6210\u529F\u9884\u60F3\u672A\u53D1\u751F\uFF01\u8BF7\u5728\u6B63\u6587\u627F\u63A5\u5C1D\u8BD5\u7EC6\u8282\uFF0C\u968F\u5373\u63CF\u5199\u7A81\u53D1\u610F\u5916\u963B\u788D\u4E0E\u771F\u5B9E\u632B\u6298\u540E\u679C\u3002`);
        }
        if (ts) {
          lines.push("\u3010\u76EE\u6807\u5F53\u524D\u6001\u52BF\u4E0E\u884C\u4E3A\u7126\u70B9\uFF08\u767D\u63CF\u7EA6\u675F\uFF09\u3011");
          const defaultTargetName = st.targetId === "college" ? "\u6797\u82E5\u96EA" : "\u9648\u96E8\u5A77";
          const targetName = st.target && (st.target.realName || st.target.name) || (ts.targetName || defaultTargetName);
          if (st.target) {
            lines.push(`- \u76EE\u6807\u4EBA\u7269\uFF1A${targetName}`);
          }
          if (ts.route) {
            const curLoc = ts.route.currentPlace ? `[${ts.route.currentPlace}] ` : "";
            const noteStr = ts.route.note ? `[${ts.route.note}] ` : "";
            lines.push(`- \u52A8\u7EBF\u60C5\u5883\uFF1A${curLoc}${noteStr}${ts.route.prompt || ""}`.trim());
          }
          if (placeName) {
            lines.push(`- \u5F53\u524D\u4F4D\u7F6E\uFF1A[${placeName}]\uFF08\u672C\u697C\u5979\u53EA\u5728\u8FD9\u91CC\uFF1B\u4E25\u7981\u628A\u5979\u5199\u5230\u522B\u7684\u573A\u6240\uFF0C\u4E5F\u4E25\u7981\u63D0\u524D\u62B5\u8FBE\u4E0B\u4E00\u7AD9\u2014\u2014\u5730\u70B9\u53D8\u66F4\u53EA\u8BA4\u56DE\u6267\u91CC\u7684\u300C\u76EE\u6807\u52A8\u5411\u63A8\u8FDB\u300D\uFF09`);
          }
          if (ts.outfit) {
            lines.push(`- \u5F53\u524D\u7740\u88C5\uFF1A[${ts.outfit.name}] ${ts.outfit.desc}\u3002${ts.outfit.prompt || ""}`);
          }
          if (ts.somatic) {
            const modStr = Object.entries(ts.somatic.mod || {}).map(([k, v]) => `${k.toUpperCase()} ${v > 0 ? "+" : ""}${v}`).join(" ");
            lines.push(`- \u60C5\u7EEA\u8EAB\u5FC3\uFF1A[${ts.somatic.name}] ${ts.somatic.reason}${modStr ? `\uFF08${modStr}\uFF09` : ""}\u3002${ts.somatic.prompt || ""}`);
          }
          if (ts.hand) {
            let handExtra = "";
            if (ts.hand.fumbling) {
              handExtra = " \u26A0\uFE0F\u3010\u7834\u7EFD\u66B4\u9732\uFF1A\u4F4E\u611F\u77E5\u7FFB\u627E\u6001\uFF0C\u6CE8\u610F\u529B\u88AB\u624B\u4E2D\u4E8B\u52A1\u5360\u6EE1\uFF0C\u89C6\u7EBF\u8131\u79BB\u5468\u56F4\u73AF\u5883\uFF0C\u767D\u63CF\u5176\u4E13\u6CE8\u627E\u7269\u3001\u80CC\u8EAB\u65E0\u5907\u7EC6\u8282\u3011";
            } else if (ts.hand.isCarriage) {
              handExtra = " \u{1F687}\u3010\u8F66\u53A2\u60C5\u5883\uFF1A\u968F\u8F66\u4F53\u6643\u8361\u800C\u5FAE\u6446\uFF0C\u4E0E\u5916\u754C\u58F0\u97F3\u5C01\u95ED\u9694\u79BB\u3011";
            }
            lines.push(`- \u53CC\u624B\u7126\u70B9\uFF1A[${ts.hand.name}] ${ts.hand.desc}${handExtra}`);
          }
          const herAlert = pkg.herAlert || st.herAlert;
          if (herAlert) {
            lines.push(`- \u8B66\u89C9\u53CD\u5E94\uFF1A${herAlert}`);
          }
        }
        lines.push("\u7EAA\u5F8B\uFF1A\u5355\u8F6E\u6B63\u6587\u4EC5\u9650\u5F53\u524D\u573A\u6240\u7EA6 1~2 \u5206\u949F\u5FAE\u89C2\u5207\u7247\uFF0C\u63CF\u5199\u5B8C\u6700\u65B0\u52A8\u9759\u540E\u5373\u523B\u5B9A\u683C\uFF1B\u672C\u8F6E\u52A8\u4F5C\u4E0E\u6570\u503C\u5DF2\u7531\u4E2D\u63A7\u5C01\u8D26\uFF0C\u6B63\u6587\u7167\u6B64\u56DE\u6267\u6F14\u7ECE\uFF0C\u6210\u8D25\u4E0D\u5F97\u7BE1\u6539\uFF1B\u6587\u672B\u6309\u89C4\u7533\u62A5\u4E8B\u5B9E\u3002");
        return lines.join("\n");
      }
      var TARGET_ENTRY_NAMES = {
        student: "\u3010\u76EE\u6807\u6863\u6848\u3011\u665A\u81EA\u4E60\u5973\u9AD8\u4E2D\u751F",
        college: "\u3010\u76EE\u6807\u6863\u6848\u3011\u72EC\u5C45\u5973\u5927\u5B66\u751F",
        ol: "\u3010\u76EE\u6807\u6863\u6848\u3011\u5916\u4F01\u804C\u573A\u5973\u6027",
        club: "\u3010\u76EE\u6807\u6863\u6848\u3011\u591C\u573A\u966A\u9152\u5973\u516C\u5173",
        wife: "\u3010\u76EE\u6807\u6863\u6848\u3011\u72EC\u5C45\u5168\u804C\u5C11\u5987"
      };
      function hostFn(name) {
        for (const w of hostFrames()) {
          try {
            if (typeof w[name] === "function") return w[name].bind(w);
          } catch (e) {
          }
          try {
            const th = w && w.TavernHelper;
            if (th && typeof th[name] === "function") return th[name].bind(th);
          } catch (e) {
          }
        }
        return null;
      }
      function hostCharacterData() {
        for (const w of hostFrames()) {
          try {
            const st = w && w.SillyTavern;
            if (!st || typeof st.getContext !== "function") continue;
            const ctx = st.getContext();
            const ch = ctx && ctx.characters && ctx.characters[ctx.characterId ?? ctx.this_chid];
            if (ch && ch.data) return ch.data;
          } catch (e) {
          }
        }
        return null;
      }
      async function syncTargetWorldbook(targetId = "college") {
        const attempts = [];
        const helper = findTavernHelper();
        if (!helper || typeof helper.getWorldbook !== "function" || typeof helper.replaceWorldbook !== "function") {
          return { skipped: true, reason: "\u65E0\u4E16\u754C\u4E66 API", attempts };
        }
        try {
          const names = [];
          if (typeof helper.getCharWorldbookNames === "function") {
            try {
              const bindings = await helper.getCharWorldbookNames("current");
              if (bindings && bindings.primary) names.push(bindings.primary);
              if (bindings && Array.isArray(bindings.additional)) names.push(...bindings.additional);
              if (Array.isArray(bindings)) names.push(...bindings);
            } catch (e) {
              attempts.push("getCharWorldbookNames \u5931\u8D25: " + (e && e.message));
            }
          }
          try {
            const card = hostCharacterData();
            const fromCard = card && card.extensions && card.extensions.world;
            if (fromCard) names.push(fromCard);
          } catch (e) {
          }
          if (typeof helper.getWorldbookNames === "function") {
            try {
              const all = await helper.getWorldbookNames();
              if (Array.isArray(all)) names.push(...all);
            } catch (e) {
              attempts.push("getWorldbookNames \u5931\u8D25: " + (e && e.message));
            }
          }
          names.push("\u5C3E\u884C");
          let bookName = null, entries = null;
          for (const name of [...new Set(names.filter(Boolean))]) {
            try {
              const got = await helper.getWorldbook(name);
              attempts.push("\u8BFB " + name + " \u2192 " + (Array.isArray(got) ? got.length : 0) + " \u6761");
              if (Array.isArray(got) && got.some((e) => /^【目标档案】/.test(e.name || e.comment || ""))) {
                bookName = name;
                entries = got;
                break;
              }
            } catch (e) {
              attempts.push("\u8BFB " + name + " \u5931\u8D25: " + (e && e.message));
            }
          }
          if (!bookName) return { skipped: true, reason: "\u6CA1\u627E\u5230\u5E26\u3010\u76EE\u6807\u6863\u6848\u3011\u7684\u4E16\u754C\u4E66", attempts };
          const targetEntries = entries.filter((e) => /^【目标档案】/.test(e.name || e.comment || ""));
          const activeName = TARGET_ENTRY_NAMES[targetId] || `\u3010\u76EE\u6807\u6863\u6848\u3011${targetId}`;
          let changed = false;
          const updated = entries.map((e) => {
            const label = e.name || e.comment || "";
            if (/^【目标档案】/.test(label)) {
              const shouldEnable = label === activeName;
              const shouldConstant = shouldEnable;
              if (e.enabled !== shouldEnable || e.constant !== shouldConstant) {
                changed = true;
                return {
                  ...e,
                  enabled: shouldEnable,
                  constant: shouldConstant,
                  disable: !shouldEnable
                };
              }
            }
            return e;
          });
          if (!changed) return { ok: true, name: bookName, targetId, activeName, unchanged: true, attempts };
          await helper.replaceWorldbook(bookName, updated, { render: "immediate" });
          console.log(`[M4][\u4E16\u754C\u4E66] \u76EE\u6807\u6761\u76EE\u540C\u6B65\u6210\u529F\uFF1A${activeName} (\u5E38\u9A7B)\uFF0C\u5176\u4F59\u7981\u7528`);
          return { ok: true, name: bookName, targetId, activeName, attempts };
        } catch (err) {
          console.warn("[M4][\u4E16\u754C\u4E66] \u76EE\u6807\u6761\u76EE\u540C\u6B65\u5F02\u5E38\uFF1A", err && (err.message || err));
          return { ok: false, error: err && err.message, attempts };
        }
      }
      var OPENING_SOURCE = { college: "first_mes", student: "alt:0" };
      async function applyTargetOpening(targetId) {
        const spec = OPENING_SOURCE[targetId];
        if (!spec) return { skipped: true, reason: "\u8BE5\u76EE\u6807\u6CA1\u6709\u72EC\u7ACB\u5F00\u573A\u767D" };
        const card = hostCharacterData();
        if (!card) return { skipped: true, reason: "\u62FF\u4E0D\u5230\u89D2\u8272\u5361\u6570\u636E" };
        const text = spec === "first_mes" ? card.first_mes : (card.alternate_greetings || [])[Number(spec.split(":")[1])];
        if (!text) return { skipped: true, reason: "\u5361\u91CC\u6CA1\u6709\u5BF9\u5E94\u5F00\u573A\u767D" };
        const setMsgs = hostFn("setChatMessages");
        if (!setMsgs) return { skipped: true, reason: "\u5BBF\u4E3B\u65E0 setChatMessages" };
        let count = null;
        for (const w of hostFrames()) {
          try {
            const st = w && w.SillyTavern;
            const ctx = st && typeof st.getContext === "function" ? st.getContext() : null;
            if (ctx && Array.isArray(ctx.chat)) {
              count = ctx.chat.length;
              break;
            }
          } catch (e) {
          }
        }
        if (count !== null && count > 1) return { skipped: true, reason: "\u804A\u5929\u5DF2\u6709\u5185\u5BB9\uFF0C\u4E0D\u8986\u76D6\u5F00\u573A" };
        try {
          await setMsgs([{ message_id: 0, message: text }], { refresh: "affected" });
          return { ok: true, swapped: targetId };
        } catch (e) {
          return { ok: false, error: e && e.message };
        }
      }
      async function startGlue() {
        const api = detectApi();
        if (!api.vars.has) return { ok: false, reason: "\u65E0\u9152\u9986\u53D8\u91CF API\uFF08\u975E\u9152\u9986\u52A9\u624B\u73AF\u5883\uFF09" };
        const g0 = typeof globalThis !== "undefined" ? globalThis : window;
        const nameHolder = typeof g0.getCurrentCharacterName === "function" && g0 || (g0.TavernHelper && g0.TavernHelper.getCurrentCharacterName ? g0.TavernHelper : null);
        if (nameHolder) {
          try {
            const name = String(await nameHolder.getCurrentCharacterName() || "");
            if (name && !name.includes("\u5C3E\u884C")) return { ok: false, reason: "\u975E\u5C3E\u884C\u5361\uFF08" + name + "\uFF09" };
          } catch (e) {
          }
        }
        const state = { game: null, conf: { autoSettle: false }, pending: null, raced: false, injectMode: null, injectVerified: null };
        {
          const v0 = await api.vars.read();
          if (v0[VAR_CONF]) Object.assign(state.conf, v0[VAR_CONF]);
        }
        async function rebuild() {
          const v = await api.vars.read();
          if (v[VAR_CONF]) Object.assign(state.conf, v[VAR_CONF]);
          const saved = v[VAR_SAVE];
          if (saved && saved.v === 1) {
            state.game = createGame({ saved });
          } else {
            const init = Object.assign(defaultInit(v[VAR_INIT]), v[VAR_INIT] || {});
            state.game = createGame(init);
          }
          const currentTargetId = state.game && state.game._g && state.game._g.targetId || v[VAR_INIT] && v[VAR_INIT].targetId || "college";
          syncTargetWorldbook(currentTargetId).then((res) => {
            state.wb = res;
          }).catch(() => {
          });
          return state.game;
        }
        async function persist() {
          const snap = state.game.snapshot();
          await api.vars.assign({
            [VAR_SNAP]: snap,
            [VAR_SAVE]: state.game.save(),
            wx_diag: {
              inject: state.injectMode || "unknown",
              verified: state.injectVerified ?? null,
              wb: state.wb ? { ok: !!state.wb.ok, skipped: !!state.wb.skipped, reason: state.wb.reason || state.wb.error || null, name: state.wb.name || null, active: state.wb.activeName || null } : null,
              opening: state.opening || null,
              floor: state.game.save().floor,
              at: Date.now()
            }
          });
          try {
            if (typeof window !== "undefined" && window.parent && window.parent !== window) {
              window.parent.postMessage({ wxSnap: snap }, "*");
            }
          } catch (e) {
          }
          return snap;
        }
        async function handleFloor(llmText) {
          if (!state.game) await rebuild();
          const result = state.game.processFloor(String(llmText || ""));
          result.stats = await persist();
          return result;
        }
        async function newGame(init) {
          await api.vars.assign({ [VAR_INIT]: init, [VAR_SAVE]: null });
          state.game = null;
          await rebuild();
          if (init && init.targetId) {
            try {
              state.wb = await syncTargetWorldbook(init.targetId);
            } catch (e) {
              state.wb = { ok: false, error: e && e.message };
            }
            try {
              state.opening = await applyTargetOpening(init.targetId);
            } catch (e) {
              state.opening = { ok: false, error: e && e.message };
            }
          }
          return persist();
        }
        async function resetGame() {
          await api.vars.assign({ [VAR_INIT]: null, [VAR_SAVE]: null });
          state.game = null;
          syncTargetWorldbook("college").catch(() => {
          });
        }
        async function setConf(patch) {
          Object.assign(state.conf, patch || {});
          await api.vars.assign({ [VAR_CONF]: state.conf });
          return state.conf;
        }
        function notifySettlePanel(r) {
          let shown = false;
          try {
            const top = typeof window !== "undefined" && window.parent && window.parent !== window ? window.parent : null;
            if (top && top.WxStatusbar && typeof top.WxStatusbar.settle === "function") {
              top.WxStatusbar.settle(r.package);
              shown = true;
              return;
            }
            if (top) top.postMessage({ wxSettle: r.package }, "*");
          } catch (e) {
            console.warn("[M4] \u9762\u677F\u76F4\u8C03\u5931\u8D25\uFF1A", e && e.message);
          }
          console.log("[M4] \u9762\u677F\u901A\u77E5\u5DF2\u53D1", shown ? "\uFF08\u76F4\u8C03\u2713\uFF09" : "\uFF08\u4EC5\u6D88\u606F\u901A\u9053\uFF09");
        }
        async function onUserSent(messageId) {
          try {
            console.log("[M4] MESSAGE_SENT \u6536\u5230", messageId !== void 0 ? "\u697C" + messageId : "");
            if (state.conf.autoSettle) {
              console.log("[M4] \u81EA\u52A8\u63B7\u6A21\u5F0F\uFF0C\u8DF3\u8FC7\u62E6\u622A");
              return;
            }
            const msg = await api.readById(messageId);
            const text = extractLlmText(msg);
            if (!text || text.startsWith("/")) {
              console.log("[M4] \u7A7A\u8F93\u5165/\u659C\u6760\u547D\u4EE4\uFF0C\u653E\u884C\u4E0D\u7ED3\u7B97");
              return;
            }
            state.pending = { text };
            if (!state.game) await rebuild();
            const topWin = typeof window !== "undefined" && window.parent && window.parent !== window ? window.parent : typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null;
            let pickedActions = null;
            if (topWin && topWin.WxStatusbar && typeof topWin.WxStatusbar.consumeActiveActions === "function") {
              try {
                pickedActions = topWin.WxStatusbar.consumeActiveActions();
              } catch (e) {
              }
            }
            const actSummary = pickedActions && pickedActions.length ? pickedActions.map((a) => `${a.id}(${a.name || a.id})`).join(", ") : "\u672A\u9009\u80F6\u56CA\uFF08\u7EAF\u53D9\u4E8B\uFF09";
            console.log(`[M4] \u52A8\u4F5C\u8F93\u5165\uFF1A[${actSummary}] \uFF5C \u4F34\u968F\u53D9\u4E8B\uFF1A${String(text).slice(0, 30)}`);
            const r = state.game.settleInput(text, { actions: pickedActions || [] });
            state.pending = null;
            console.log(`[M4] \u7ED3\u7B97\u5B8C\u6210\uFF1A\u697C${r.floor} \xB7 \u52A8\u4F5C${r.package.actions.length}\u4E2A${r.package.narrativeOnly ? "\uFF08\u7EAF\u53D9\u4E8B\uFF09" : ""}`);
            let injectRes = null;
            if (api.injectPrompts) {
              try {
                api.uninjectPrompts(["wx_receipt"]);
              } catch (e) {
              }
              const pos = Number.isInteger(state.conf.injectPos) ? state.conf.injectPos : 1;
              const depth = Number.isInteger(state.conf.injectDepth) ? state.conf.injectDepth : 1;
              injectRes = await api.injectPrompts([{
                id: "wx_receipt",
                position: pos,
                depth,
                role: 0,
                content: receiptText(r)
              }]);
            }
            state.injectMode = injectRes ? injectRes.mode : "none";
            state.injectVerified = injectRes ? injectRes.verified : null;
            if (injectRes) {
              console.log(`[M4] \u56DE\u6267\u5DF2\u6CE8\u5165 \u2713\uFF08\u901A\u9053\uFF1A${injectRes.mode}\uFF09` + (injectRes.verified === null ? "" : injectRes.verified ? "\uFF0C\u56DE\u8BFB\u6821\u9A8C\u901A\u8FC7" : "\uFF0C\u56DE\u8BFB\u6821\u9A8C\u4E0D\u7B26"));
            } else {
              console.warn("[M4] \u56DE\u6267\u6CE8\u5165\u5931\u8D25\uFF1ATavernHelper.injectPrompts \u4E0E SillyTavern.setExtensionPrompt \u90FD\u4E0D\u53EF\u7528\u2014\u2014\u6A21\u578B\u5C06\u770B\u4E0D\u5230\u4E2D\u63A7\u771F\u503C");
            }
            await persist();
            notifySettlePanel(r);
            console.log("[M4] \u9762\u677F\u901A\u77E5\u5DF2\u53D1 \u2713");
            if (state.raced && api.stopAllGeneration && api.generate) {
              state.raced = false;
              try {
                api.stopAllGeneration();
              } catch (e) {
              }
              try {
                api.generate({});
              } catch (e) {
              }
            }
          } catch (e) {
            console.warn("[M4] \u62E6\u622A\u7ED3\u7B97\u5931\u8D25\uFF1A", e && (e.stack || e.message || e));
            state.pending = null;
          }
        }
        async function onReplyEnded() {
          try {
            const v = await api.vars.read();
            if (v[VAR_CONF]) Object.assign(state.conf, v[VAR_CONF]);
            const msg = api.readLast ? await api.readLast() : null;
            const text = extractLlmText(msg);
            if (state.conf.autoSettle) {
              if (text) await handleFloor(text);
              return;
            }
            if (!state.game) {
              await rebuild();
              return;
            }
            if (text) {
              state.game.processReply(text);
              await persist();
            }
          } catch (e) {
          }
        }
        api.onEvent("MESSAGE_SENT", (messageId) => onUserSent(messageId));
        api.onEvent("GENERATION_STARTED", () => {
          if (state.pending) state.raced = true;
        });
        api.onEvent("GENERATION_ENDED", onReplyEnded);
        api.onEvent("MESSAGE_SWIPED", () => {
        });
        if (typeof globalThis !== "undefined" && !globalThis.WxGlue) {
          globalThis.WxGlue = {
            handleFloor,
            rebuild,
            persist,
            newGame,
            resetGame,
            setConf,
            syncTargetWorldbook,
            onUserSent,
            onReplyEnded,
            get game() {
              return state.game;
            },
            get conf() {
              return state.conf;
            }
          };
        }
        return { ok: true, hasEvent: true, hasReadLast: !!api.readLast };
      }
      module.exports = { startGlue, syncTargetWorldbook, applyTargetOpening, receiptText, VAR_SAVE, VAR_SNAP, VAR_INIT, VAR_CONF };
    }
  });

  // src/host/bootstrap.js
  var require_bootstrap = __commonJS({
    "src/host/bootstrap.js"(exports, module) {
      var { createGame } = require_game();
      var facts = require_facts();
      var map = require_map();
      var { loadLexicon } = require_lexicon2();
      var { startGlue } = require_glue();
      var LP = require_lifepack();
      var gluePromise = startGlue();
      var api = { createGame, facts, map, loadLexicon, lifepack: LP, glue: gluePromise, version: "0.7" };
      if (typeof window !== "undefined") window.WxEngine = api;
      if (typeof globalThis !== "undefined") globalThis.WxEngine = api;
      if (typeof module !== "undefined") module.exports = api;
    }
  });
  require_bootstrap();
})();

;(function mountWxStatusbar() {
  var tries = 0;
  (function wait() {
    if (window.WxGlue || typeof TavernHelper !== "undefined" || tries > 15) return mount();
    tries++;
    setTimeout(wait, 200);
  })();

  function mount() {
    var sameWin = !(window.parent && window.parent !== window);
    var topDoc = sameWin ? document : window.parent.document;
    var topWin = sameWin ? window : window.parent;

    var formSheld = topDoc.getElementById("form_sheld");
    var sendForm = topDoc.getElementById("send_form");
    var chat = topDoc.querySelector("#chat");
    if (!formSheld && !sendForm && !chat) {
      if (++tries < 30) setTimeout(mount, 250);
      return;
    }

    // 1. 注入或刷新 CSS 到父页面 head
    var styleEl = topDoc.getElementById("wx-statusbar-style");
    if (!styleEl) {
      styleEl = topDoc.createElement("style");
      styleEl.id = "wx-statusbar-style";
      topDoc.head.appendChild(styleEl);
    }
    styleEl.textContent = "/* GLM 样式骨架保留；刻度/数据接口/音效引擎按尾行规格适配。无图片、字体或库依赖。 */\n.trpg, .trpg *, .wx-terminal-backdrop, .wx-terminal-backdrop *, .wx-dialog, .wx-dialog * {\n  box-sizing: border-box;\n}\nmain.wx-standalone-main {\n  width: 100%;\n  max-width: 960px;\n  min-height: 100%;\n  padding: 0 4px;\n  margin: 0 auto;\n  overflow: visible;\n  /* 独立预览壳不在下面的全局 border-box 名单里：content-box 下 100% + 左右内边距会横向溢出 */\n  box-sizing: border-box;\n  /* 预览壳是 flex 列容器，.trpg 作为它的 flex item 默认 min-width:auto 会被子项撑破 */\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n  justify-content: flex-end;\n}\n.preview-area { display: none; margin-bottom: 12px; }\n.preview-label { color: #90969f; font-size: 11px; margin: 0 0 10px; }\n.speaker { font-weight: 700; font-size: 13px; }\n.story { margin: 6px 0 14px; color: #c5c8ce; line-height: 1.7; font-size: 13px; }\n.preview-tools { display: none; flex-wrap: wrap; gap: 8px; margin-top: 14px; align-items: center; }\n.preview-tools small { color: #9298a1; }\n.preview-tools button[aria-pressed=\"true\"] { border-color: #b3c9b9; background: #354d43; }\n.preview-status { flex-basis: 100%; margin: 0; color: #a9bcb0; font-size: 12px; }\n/* ═══ C 案 · 夜巡：色板 token + 胶片条外壳 ═══\n   语义约束：一个颜色只表达一件事；灰阶负责层级，彩色只负责状态。 */\n.trpg { --border: #1d2833; --muted: #93a7ba; --paper: #0d141c; --beat: 0.833s;\n  --ink-0: #070b10;\n  --ink-1: #0d141c;\n  --ink-2: #131c26;\n  --line: #1d2833;\n  --t-hi: #eef4fa;\n  --t-mid: #93a7ba;\n  --t-low: #5f7284;\n  --heat: #f0b355;\n  --safe: #5fd6c3;\n  --danger: #ff5a68;\n  --her: #e79aa8;\n  color: var(--t-hi);\n  background: linear-gradient(180deg, #0b1219 0%, #080d13 58%, #05080c 100%);\n  border: 0;\n  border-top: 1px solid rgba(240, 179, 85, 0.26);\n  border-radius: 12px 12px 0 0;\n  font-size: 12px;\n  box-shadow: 0 -20px 44px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05);\n  position: relative;\n  overflow: visible;\n  width: 100%;\n  min-width: 0;\n  box-sizing: border-box;\n}\n/* 材质层：钠灯侧光 + 冷侧反光 + 雨幕 + 颗粒（原来那层 alpha 0.012 的扫描纹基本看不见） */\n.trpg::before {\n  content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 1;\n  background:\n    radial-gradient(78% 130% at 12% -10%, rgba(240, 179, 85, 0.12), transparent 56%),\n    radial-gradient(60% 120% at 96% 120%, rgba(95, 214, 195, 0.06), transparent 62%),\n    repeating-linear-gradient(102deg, rgba(190, 216, 245, 0.035) 0 1px, transparent 1px 8px),\n    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.012) 0 1px, transparent 1px 3px);\n  border-radius: inherit;\n}\n/* 状态即天气：过线泛暖，崩溃泛红；终局封时顶光转红 */\n.trpg[data-line=\"deform\"] {\n  box-shadow: 0 -20px 44px rgba(0, 0, 0, 0.7), inset 0 0 34px rgba(240, 179, 85, 0.14);\n}\n.trpg[data-line=\"crash\"] {\n  box-shadow: 0 -20px 44px rgba(0, 0, 0, 0.7), inset 0 0 44px rgba(255, 90, 104, 0.26);\n}\n.trpg:has(.slim-tag.strike-tag.sealed) {\n  border-top-color: rgba(255, 90, 104, 0.45);\n}\n.trpg button, #wx-statusbar-root button, .wx-terminal-backdrop button, dialog.wx-dialog button, .preview-tools button {\n  font: inherit;\n  color: #d9e4ed !important;\n  background: #26333e !important;\n  border: 1px solid #4a5d70 !important;\n  border-radius: 5px;\n  padding: 4px 10px;\n  cursor: pointer;\n  min-height: 28px;\n  transition: all .15s;\n  box-sizing: border-box;\n}\n.trpg button:hover, #wx-statusbar-root button:hover, .wx-terminal-backdrop button:hover, dialog.wx-dialog button:hover, .preview-tools button:hover {\n  background: #354757 !important;\n  border-color: #8da6bd !important;\n  color: #ffffff !important;\n}\n.trpg button:active, #wx-statusbar-root button:active, .wx-terminal-backdrop button:active, dialog.wx-dialog button:active {\n  background: #1c2630 !important;\n}\n.trpg button:focus-visible { outline: 1px solid rgba(240, 179, 85, 0.55); outline-offset: 2px; }\n\n/* ═══ 常驻条：一块路牌 + 一排读数（C 案） ═══ */\n.trpg-slim-bar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  height: 40px;\n  padding: 0 10px;\n  gap: 8px;\n  position: relative;\n  z-index: 5;\n  user-select: none;\n}\n.slim-left {\n  display: flex;\n  align-items: center;\n  gap: 9px;\n  min-width: 0;\n  flex: 1 1 auto;\n  overflow: hidden;\n  white-space: nowrap;\n}\n/* 大区：等宽小上标，不再是一枚蓝徽章 */\n.slim-dist-badge {\n  background: none;\n  border: 0;\n  padding: 0;\n  color: var(--t-low);\n  font: 600 9.5px/1 ui-monospace, Consolas, monospace;\n  letter-spacing: .18em;\n}\n/* 场所：路牌。15px 加重 + 底下一道向右渐隐的钠黄灯带 */\n.slim-place {\n  position: relative;\n  padding-bottom: 4px;\n  font-size: 15px;\n  font-weight: 600;\n  letter-spacing: .01em;\n  color: var(--t-hi);\n}\n.slim-place::after {\n  content: '';\n  position: absolute;\n  left: 0;\n  bottom: 0;\n  width: 62%;\n  height: 2px;\n  background: linear-gradient(90deg, var(--heat), rgba(240, 179, 85, 0));\n}\n.slim-tags-group {\n  display: inline-flex;\n  align-items: center;\n  gap: 10px;\n}\n/* 状态不再是胶囊：左侧一根 2px 竖条 + 小字 */\n.slim-tag {\n  font-size: 11px;\n  padding: 0 0 0 7px;\n  border-left: 2px solid var(--line);\n  border-radius: 0;\n  white-space: nowrap;\n  color: var(--t-mid);\n}\n.slim-tag.weather {\n  border-left-color: rgba(95, 214, 195, .55);\n  color: #9ed6cd;\n}\n.slim-tag.strike-tag.allowed {\n  border-left-color: rgba(95, 214, 195, .75);\n  color: #a7e5d9;\n}\n.slim-tag.strike-tag.sealed {\n  border-left-color: var(--danger);\n  color: #ff9aa3;\n}\n.slim-tag.remain {\n  border-left-color: transparent;\n  color: var(--t-low);\n  font-size: 10.5px;\n}\n.slim-tag.id-badge {\n  border-left-color: var(--her);\n  color: #eec3cb;\n  cursor: pointer;\n}\n\n/* ── C4 单色图标：默认 1em，按场景覆盖尺寸；全部 currentColor，跟着文字色走 ── */\n.wx-ico { display: inline-block; width: 1em; height: 1em; vertical-align: -0.125em; flex: none; stroke-width: 1.7; }\n/* 12~13px 的小图标把线加粗半档，否则在深底上糊成一团 */\n.step-ico .wx-ico, .slim-tag.weather .wx-ico, .slim-tag.id-badge .wx-ico,\n.wx-item-type-badge .wx-ico, .audio-ico .wx-ico, .phone-icon .wx-ico, .term-ico .wx-ico { stroke-width: 2; }\n.step-ico { display: inline-flex; align-items: center; justify-content: center; }\n.step-ico .wx-ico { width: 13px; height: 13px; }\n.wx-terminal-icon .wx-ico { width: 16px; height: 16px; }\n.phone-icon .wx-ico, .term-ico .wx-ico { width: 13px; height: 13px; }\n.audio-ico .wx-ico { width: 12px; height: 12px; }\n.dev-ico .wx-ico { width: 13px; height: 13px; margin-right: 6px; vertical-align: -2px; }\n.btn-ico .wx-ico { width: 13px; height: 13px; vertical-align: -2px; }\n.slim-tag.weather .wx-ico, .slim-tag.id-badge .wx-ico { width: 12px; height: 12px; margin-right: 3px; vertical-align: -2px; }\n.wx-item-type-badge .wx-ico { width: 12px; height: 12px; margin-right: 4px; vertical-align: -2px; opacity: .85; }\n\n/* ── 她的鞋具：只露鞋名，细节走悬停 ── */\n.gear-line {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  padding-bottom: 10px;\n  margin-bottom: 10px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n}\n.gear-line[hidden] { display: none !important; }\n.gear-label {\n  font: 600 9.5px/1 ui-monospace, Consolas, monospace;\n  letter-spacing: .16em;\n  color: var(--t-low);\n  flex: none;\n}\n.gear-name {\n  font-size: 12px;\n  font-weight: 600;\n  color: var(--t-hi);\n  border-bottom: 1px dashed rgba(255, 255, 255, 0.18);\n  cursor: default;\n}\n\n/* 距离档：四根竖刻度，亮的那格发钠黄光 */\n.slim-center {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  white-space: nowrap;\n  flex-shrink: 0;\n  font-size: 11px;\n  background: none;\n  border: 0;\n  padding: 0;\n}\n.slim-phase {\n  color: var(--t-low);\n  font: 600 9.5px/1 ui-monospace, Consolas, monospace;\n  letter-spacing: .18em;\n}\n.slim-divider {\n  display: none;\n}\n.slim-dist {\n  color: var(--t-hi);\n  font-size: 12px;\n  font-weight: 600;\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n}\n.slim-pips {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n}\n.slim-pips .pip {\n  width: 3px;\n  height: 13px;\n  border-radius: 1.5px;\n  border: 0;\n  background: #22303d;\n}\n.slim-pips .pip.active {\n  background: var(--heat);\n  box-shadow: 0 0 9px rgba(240, 179, 85, 0.9);\n}\n.slim-pips.warm .pip.active {\n  background: var(--heat);\n  border-color: var(--heat);\n  box-shadow: 0 0 9px rgba(240, 179, 85, 0.9);\n}\n\n.slim-right {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  flex-shrink: 0;\n}\n\n/* 体力：一根细线，数字用等宽 */\n.slim-stamina {\n  display: inline-flex;\n  align-items: center;\n  gap: 7px;\n  font-size: 10.5px;\n  color: var(--t-mid);\n  background: none;\n  padding: 0;\n  border-radius: 0;\n  border: 0;\n}\n.slim-stamina[data-band=\"yellow\"] { color: var(--heat); }\n.slim-stamina[data-band=\"red\"] { color: #ff9aa3; }\n.slim-stamina-val {\n  font-family: ui-monospace, Consolas, monospace;\n  font-weight: 600;\n  font-size: 11px;\n}\n.slim-stamina-bar {\n  width: 40px;\n  height: 2px;\n  background: #1d2933;\n  border-radius: 1px;\n  overflow: hidden;\n  display: inline-block;\n}\n.slim-stamina-bar .stamina-fill {\n  display: block;\n  height: 100%;\n  background: currentColor;\n  transition: width .3s ease;\n}\n\n/* 心跳：全条唯一的主角（♥ 19px / 数字 24px / BPM 退成 9px） */\n.heart-popover-wrap {\n  position: relative;\n  display: inline-flex;\n  align-items: center;\n}\n.trpg .heart-pill-btn {\n  background: none !important;\n  border: 0 !important;\n  border-radius: 0 !important;\n  padding: 0 !important;\n  cursor: pointer;\n  display: inline-flex;\n  align-items: baseline;\n  gap: 3px;\n  color: var(--t-hi);\n  font-size: 11.5px;\n  transition: opacity .15s ease;\n  min-height: 0 !important;\n}\n.trpg .heart-pill-btn:hover { background: none !important; border: 0 !important; opacity: .9; }\n.trpg .heart-pill-btn.open { background: none !important; border: 0 !important; box-shadow: none !important; }\n@keyframes mini-heart-beat {\n  0%, 100% { transform: scale(1); }\n  14% { transform: scale(1.36); }\n  28% { transform: scale(1); }\n  42% { transform: scale(1.18); }\n  70% { transform: scale(1); }\n}\n.mini-heart {\n  display: inline-block;\n  color: var(--her);\n  animation: mini-heart-beat var(--beat, 0.833s) ease-in-out infinite;\n  transform-origin: center;\n  font-size: 19px;\n  line-height: 1;\n  filter: drop-shadow(0 0 7px rgba(231, 154, 168, 0.75));\n}\n.trpg[data-line=\"deform\"] .mini-heart {\n  color: var(--heat);\n  filter: drop-shadow(0 0 9px rgba(240, 179, 85, 0.85));\n}\n.trpg[data-line=\"crash\"] .mini-heart {\n  color: var(--danger);\n  filter: drop-shadow(0 0 11px rgba(255, 90, 104, 0.95));\n}\n.mini-heart-num {\n  font-family: ui-monospace, Consolas, monospace;\n  font-weight: 600;\n  font-size: 24px;\n  letter-spacing: -.02em;\n  color: #ffffff;\n  text-shadow: 0 0 20px rgba(231, 154, 168, 0.35);\n}\n.mini-heart-bpm {\n  font-size: 9.5px;\n  /* 9px 上用 --t-low 会掉到 3.5:1，这里单开一档中间灰 */\n  color: #7f92a4;\n  margin-left: 1px;\n  align-self: center;\n  font-family: ui-monospace, Consolas, monospace;\n  font-weight: 500;\n}\n\n/* 向上弹出的心跳仪表盘卡片 */\n.heart-popover-card {\n  position: absolute;\n  bottom: calc(100% + 8px);\n  right: 0;\n  width: 300px;\n  max-width: calc(100vw - 20px);\n  background: rgba(16, 23, 31, 0.98);\n  border: 1px solid #3c526b;\n  border-radius: 8px;\n  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.06);\n  padding: 10px 12px;\n  z-index: 10002;\n  backdrop-filter: blur(14px);\n  display: none;\n  flex-direction: column;\n  align-items: center;\n  animation: popover-up .18s cubic-bezier(.16, 1, .3, 1);\n}\n.heart-popover-card.show {\n  display: flex !important;\n}\n.heart-popover-card::after {\n  content: '';\n  position: absolute;\n  bottom: -6px;\n  right: 28px;\n  width: 10px;\n  height: 10px;\n  background: #18222d;\n  border-right: 1px solid #3c526b;\n  border-bottom: 1px solid #3c526b;\n  transform: rotate(45deg);\n}\n@keyframes popover-up {\n  from { opacity: 0; transform: translateY(8px) scale(0.96); }\n  to { opacity: 1; transform: translateY(0) scale(1); }\n}\n.popover-head {\n  display: flex;\n  justify-content: space-between;\n  width: 100%;\n  align-items: center;\n  padding-bottom: 5px;\n  margin-bottom: 6px;\n  border-bottom: 1px solid #2a3746;\n}\n.popover-title {\n  font-size: 11px;\n  font-weight: 600;\n  color: #a4b9c9;\n  letter-spacing: .5px;\n}\n.popover-close-btn {\n  background: transparent !important;\n  border: 0 !important;\n  color: #7d91a3 !important;\n  cursor: pointer;\n  font-size: 12px;\n  padding: 2px 4px !important;\n  min-height: 0 !important;\n  line-height: 1;\n}\n.popover-close-btn:hover {\n  color: #fff !important;\n}\n.popover-content {\n  width: 100%;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n}\n.popover-content .heart-dial {\n  width: 154px;\n}\n.popover-content .stamina {\n  width: 154px;\n  margin-top: 2px;\n}\n.popover-content .spark {\n  width: 154px;\n  margin-top: 5px;\n}\n/* 弹层两栏：左＝生理仪表，右＝她的警觉（给档位与刻度，不给数值） */\n.popover-grid {\n  display: flex;\n  gap: 8px;\n  width: 100%;\n  align-items: stretch;\n  justify-content: center;\n}\n.popover-grid .instrument { flex: 1 1 auto; min-width: 0; }\n.popover-her {\n  flex: 0 0 86px;\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  justify-content: center;\n  gap: 6px;\n  padding-left: 9px;\n  border-left: 1px solid rgba(255, 255, 255, 0.08);\n}\n.popover-her-title { font: 600 9px/1 ui-monospace, Consolas, monospace; letter-spacing: .14em; color: var(--t-low); }\n.popover-her .alert-pips { margin-right: 0; flex-direction: column-reverse; gap: 3px; }\n.popover-her .alert-pips i { width: 15px; height: 15px; border-radius: 2px; }\n.popover-her-name { font: 600 13px/1.1 \"Noto Sans SC\", system-ui, sans-serif; color: var(--t-mid); }\n.popover-her-range { font: 500 9px/1 ui-monospace, Consolas, monospace; color: var(--t-low); letter-spacing: .06em; }\n.popover-her[data-tier=\"3\"] .popover-her-name, .popover-her[data-tier=\"4\"] .popover-her-name { color: #ff9aa3; }\n.popover-audio-row {\n  margin-top: 8px;\n  width: 100%;\n}\n.audio-btn {\n  width: 100%;\n  font-size: 11px;\n  padding: 4px 8px;\n  border-radius: 4px;\n  background: #1e2835;\n  border: 1px solid #34475a;\n  color: #d1dde8;\n  cursor: pointer;\n  min-height: 25px;\n  transition: all .15s;\n}\n.audio-btn:hover {\n  background: #293849;\n  border-color: #5c7996;\n}\n.audio-btn[aria-pressed=\"true\"] {\n  background: #233e32;\n  border-color: #4d7a63;\n  color: #9ee0bd;\n}\n\n/* 窄条小按钮：去掉按钮皮，只留文字与图标 */\n.trpg .slim-btn {\n  background: none !important;\n  border: 0 !important;\n  border-radius: 0 !important;\n  padding: 2px 4px !important;\n  cursor: pointer;\n  color: var(--t-mid) !important;\n  font-size: 11px;\n  min-height: 0 !important;\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  transition: color .15s;\n}\n.trpg .slim-btn:hover {\n  background: none !important;\n  border: 0 !important;\n  color: var(--t-hi) !important;\n}\n.trpg .slim-btn.drawer-toggle-btn.active, .trpg .slim-btn.terminal-toggle-btn.active {\n  background: none !important;\n  border: 0 !important;\n  color: var(--heat) !important;\n}\n\n/* ═══ 行动胶囊栏（C1：先随胶片条收底，胶囊本体在 C3 重做） ═══ */\n.wx-capsule-bar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 6px;\n  min-height: 32px;\n  padding: 3px 10px;\n  background: #070b10;\n  border-top: 1px solid rgba(255, 255, 255, 0.04);\n  position: relative;\n  z-index: 80;\n  user-select: none;\n}\n/* ═══ 行动胶囊栏（C3：去按钮皮，只保留\"可点感\"） ═══\n   交互钩子全部原样：类名 wx-capsule-chip / active / danger、✓ 勾选、aria-expanded、\n   .wx-posture-badge.narrative 都由 JS 切换，这里只动外观。 */\n.wx-posture-badge {\n  font: 600 9.5px/1 ui-monospace, Consolas, monospace;\n  letter-spacing: .14em;\n  padding: 0;\n  border-radius: 0;\n  background: none;\n  color: var(--t-low);\n  border: 0;\n  white-space: nowrap;\n  cursor: pointer;\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  transition: color .15s;\n}\n.wx-posture-badge:hover {\n  background: none;\n  border: 0;\n  color: var(--t-mid);\n}\n.wx-posture-badge.narrative {\n  background: none;\n  color: var(--heat);\n  border: 0;\n}\n.wx-chips-wrap {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  flex: 1 1 auto;\n  overflow-x: auto;\n  padding: 1px 0;\n  scrollbar-width: none;\n}\n.wx-chips-wrap::-webkit-scrollbar { display: none; }\n/* 极淡底 + 1px 幽灵描边 = 可点；选中用底部 2px 光条，不再整块变绿 */\n.trpg .wx-capsule-chip {\n  font-size: 11px;\n  padding: 3px 10px;\n  border-radius: 3px;\n  background: rgba(255, 255, 255, 0.055) !important;\n  color: var(--t-mid) !important;\n  border: 0 !important;\n  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.07);\n  cursor: pointer;\n  white-space: nowrap;\n  transition: background .15s, box-shadow .15s, color .15s;\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  line-height: 1.4;\n  min-height: 26px !important;\n}\n.trpg .wx-capsule-chip:hover {\n  background: rgba(255, 255, 255, 0.09) !important;\n  color: var(--t-hi) !important;\n  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);\n}\n.trpg .wx-capsule-chip.active {\n  background: rgba(95, 214, 195, 0.13) !important;\n  color: var(--safe) !important;\n  font-weight: 600;\n  box-shadow: inset 0 -2px 0 var(--safe), inset 0 0 0 1px rgba(95, 214, 195, 0.30) !important;\n}\n.trpg .wx-capsule-chip.danger {\n  color: #e59aa2 !important;\n}\n.trpg .wx-capsule-chip.danger.active {\n  background: rgba(255, 90, 104, 0.14) !important;\n  color: #ff9aa3 !important;\n  box-shadow: inset 0 -2px 0 var(--danger), inset 0 0 0 1px rgba(255, 90, 104, 0.32) !important;\n}\n/* 条件不足：虚线幽灵条 + 降透明，悬停给「缺什么」 */\n.trpg .wx-capsule-chip.locked {\n  color: var(--t-low) !important;\n  background: transparent !important;\n  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.10);\n  border: 0 !important;\n  outline: 1px dashed rgba(255, 255, 255, 0.14);\n  outline-offset: -3px;\n  opacity: .62;\n  cursor: not-allowed;\n}\n.trpg .wx-capsule-chip.locked:hover {\n  background: transparent !important;\n  color: var(--t-mid) !important;\n  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);\n  opacity: .8;\n}\n.trpg .wx-capsule-chip .chip-check {\n  font-size: 10px;\n  font-weight: 700;\n}\n.trpg .wx-more-btn {\n  font-size: 11px;\n  padding: 3px 8px;\n  border-radius: 3px;\n  background: none !important;\n  color: var(--t-low) !important;\n  border: 0 !important;\n  cursor: pointer;\n  white-space: nowrap;\n  transition: color .15s;\n  min-height: 26px !important;\n}\n.trpg .wx-more-btn:hover {\n  background: none !important;\n  color: var(--t-hi) !important;\n  border: 0 !important;\n}\n.trpg .wx-more-btn.active {\n  background: none !important;\n  color: var(--heat) !important;\n  border: 0 !important;\n}\n\n/* ═══ 二级动作抽屉 ═══ */\n.wx-action-drawer {\n  position: absolute;\n  left: 0;\n  right: 0;\n  bottom: 100%;\n  background: #080c11;\n  border: 0;\n  border-top: 1px solid rgba(255, 255, 255, 0.07);\n  border-radius: 8px 8px 0 0;\n  box-shadow: 0 -14px 40px rgba(0, 0, 0, 0.85);\n  z-index: 100;\n  max-height: min(340px, 60vh);\n  display: flex;\n  flex-direction: column;\n}\n.drawer-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 8px 12px;\n  background: linear-gradient(180deg, rgba(240, 179, 85, 0.06), transparent 92%);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n}\n.drawer-title {\n  font: 600 10px/1 ui-monospace, Consolas, monospace;\n  letter-spacing: .14em;\n  color: var(--t-mid);\n}\n.trpg .drawer-close {\n  background: transparent !important;\n  border: none !important;\n  color: var(--t-mid) !important;\n  font-size: 15px;\n  cursor: pointer;\n  padding: 0 4px !important;\n  min-height: auto !important;\n}\n.trpg .drawer-close:hover {\n  background: transparent !important;\n  border: none !important;\n  color: #ffffff !important;\n}\n.drawer-body {\n  padding: 10px 12px 22px;\n  overflow-y: auto;\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n.drawer-group-title {\n  font: 600 9.5px/1 ui-monospace, Consolas, monospace;\n  letter-spacing: .16em;\n  color: var(--t-low);\n  margin-bottom: 6px;\n  border-left: 2px solid rgba(255, 255, 255, 0.14);\n  padding-left: 6px;\n}\n.drawer-group-chips {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n}\n\n/* ═══ 战术终端（HTML5 Top Layer 原生模态对话框，穿透所有层级与容器） ═══ */\ndialog.wx-terminal-dialog, dialog.wx-dialog.wx-terminal-dialog {\n  position: fixed !important;\n  inset: 0 !important;\n  margin: auto !important;\n  width: min(860px, calc(100vw - 20px)) !important;\n  max-height: 86dvh !important;\n  /* inset:0 + height:auto 会让盒子被上下拉伸铺满（再由 max-height 截在 86dvh），\n     内容不满时就在结算条下面留一条空带；fit-content 让弹窗按内容收口。 */\n  height: fit-content !important;\n  padding: 0 !important;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden !important;\n  background: #070b10 !important;\n  border: 0 !important;\n  border-top: 1px solid rgba(240, 179, 85, 0.22) !important;\n  border-radius: 10px !important;\n  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.92) !important;\n  color: var(--t-hi) !important;\n  z-index: 100000 !important;\n  box-sizing: border-box !important;\n  animation: modal-pop 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n}\ndialog.wx-terminal-dialog:not([open]) {\n  display: none !important;\n}\ndialog.wx-terminal-dialog::backdrop {\n  background: rgba(5, 10, 16, 0.85) !important;\n  backdrop-filter: blur(8px) !important;\n  -webkit-backdrop-filter: blur(8px) !important;\n}\n@keyframes modal-pop {\n  from { opacity: 0; transform: scale(0.96) translateY(12px); }\n  to { opacity: 1; transform: scale(1) translateY(0); }\n}\n.wx-modal-head {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 12px 18px;\n  background: linear-gradient(180deg, rgba(240, 179, 85, 0.07), transparent 92%), #0a0f15;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n  flex-shrink: 0;\n}\n.wx-modal-title-wrap {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n.wx-terminal-icon {\n  font-size: 15px;\n}\n.wx-modal-title {\n  margin: 0;\n  font-size: 15px;\n  font-weight: 600;\n  color: var(--t-hi);\n  letter-spacing: 0.02em;\n}\n.wx-modal-badge {\n  background: rgba(255, 255, 255, 0.04);\n  color: var(--t-low);\n  border: 0;\n  padding: 1px 7px;\n  border-radius: 3px;\n  font: 600 9.5px/1.5 ui-monospace, Consolas, monospace;\n  letter-spacing: .12em;\n}\n.wx-modal-close {\n  background: transparent !important;\n  border: 0 !important;\n  color: var(--t-mid) !important;\n  font-size: 17px;\n  cursor: pointer;\n  padding: 4px 8px !important;\n  line-height: 1;\n  min-height: 0 !important;\n  transition: color 0.15s;\n}\n.wx-modal-close:hover {\n  color: #fff !important;\n}\n.wx-modal-body {\n  /* 结算条已移出滚动区做页脚，这里恢复正常底边距 */\n  padding: 14px 18px 12px;\n  overflow-y: auto;\n  overflow-x: hidden;\n  /* 不长个子：内容短时弹窗贴内容收口（否则 86dvh 的上限会把正文拉高，\n     在页脚上方留出一大块空区）；内容超限时 overflow 让它照常滚动。 */\n  flex: 0 1 auto;\n  min-height: 0;\n  display: flex !important;\n  flex-direction: column !important;\n  gap: 12px;\n}\n.wx-modal-body::-webkit-scrollbar { width: 6px; }\n.wx-modal-body::-webkit-scrollbar-track { background: #0d1217; }\n.wx-modal-body::-webkit-scrollbar-thumb { background: #354556; border-radius: 3px; }\n\n/* 模态内动线通栏舒展排版（留出安全顶边，图标绝不截顶） */\n.wx-modal-body .route-tracker {\n  background: #16202b;\n  border: 1px solid #2c3a4a;\n  border-radius: 6px;\n  padding: 12px 16px 14px;\n  margin-bottom: 2px;\n  overflow: visible;\n  width: 100%;\n}\n.trpg .heart-dial { display: block; width: min(100%, 164px); height: auto; overflow: visible; }\n.trpg .dial-track { stroke: #3a3842; stroke-width: 8; fill: none; stroke-linecap: round; }\n.trpg .dial-sweet { stroke: #82b68c; stroke-width: 8; fill: none; filter: drop-shadow(0 0 4px rgba(130, 182, 140, 0.55)); }\n.trpg .dial-tick { stroke: #7a7d88; stroke-width: 1; }\n.trpg .dial-linemark { stroke-width: 2.4; }\n.trpg .dial-marker { fill: #fff5f5; stroke: #b2747e; stroke-width: 3; filter: drop-shadow(0 0 5px rgba(223, 155, 168, 0.85)); }\n.trpg .dial-marker-orbit { transform-origin: 80px 80px; transition: transform 700ms cubic-bezier(.2,.75,.25,1); }\n.trpg .dial-beat-halo { fill: none; stroke: #df9ba8; stroke-width: 1; animation: ring-beat var(--beat) ease-out infinite; filter: drop-shadow(0 0 3px rgba(223, 155, 168, 0.5)); }\n.trpg .ecg-line { fill: none; stroke: #6fe3c7; stroke-width: 1.35; stroke-linejoin: round; stroke-linecap: round; filter: drop-shadow(0 0 3.5px rgba(111, 227, 199, 0.8)); }\n.trpg .ecg-scroll { animation: ecg-scroll var(--beat) linear infinite; }\n.trpg .dial-number { fill: #ffe6e6; font: 750 38px ui-monospace, Consolas, monospace; font-variant-numeric: tabular-nums; }\n.trpg[data-line=\"deform\"] .dial-number { fill: #f3dda4; text-shadow: 0 0 10px rgba(243, 221, 164, 0.55); }\n.trpg[data-line=\"crash\"] .dial-number { fill: #ff8b99; text-shadow: 0 0 14px rgba(255, 80, 100, 0.85); }\n.trpg .dial-bpm { fill: #c4b6be; font: 10px ui-monospace, Consolas, monospace; }\n.trpg .dial-label { fill: #c4b6be; font: 9px system-ui, sans-serif; }\n.trpg .dial-scale { fill: #b7b5be; font: 8px ui-monospace, Consolas, monospace; }\n.trpg .dial-heart { fill: #eaa4ae; font-size: 12px; animation: beat var(--beat) ease-in-out infinite; transform-box: fill-box; transform-origin: center; }\n.trpg .stamina { width: min(100%, 164px); margin-top: -2px; }\n.trpg .stamina { --stamina-color: #96c7a6; }\n.trpg .stamina[data-band=\"yellow\"] { --stamina-color: #ddbe75; }\n.trpg .stamina[data-band=\"red\"] { --stamina-color: #e48b8b; }\n.trpg .stamina-label { display: flex; justify-content: space-between; font-size: 10px; color: var(--stamina-color); }\n.trpg .stamina-label .band-name { font-size: 9px; opacity:.85 }\n.trpg .stamina-meter { display: block; height: 5px; margin-top: 5px; border-radius: 3px; background: #404b45; overflow: hidden; }\n.trpg .stamina-fill { display: block; width: 72%; height: 100%; border-radius: inherit; background: var(--stamina-color); transition: width 700ms cubic-bezier(.2,.75,.25,1); }\n.trpg .audio-status { flex-basis: 100%; color: var(--muted); font-size: 11px; }\n.trpg .dev-card { border: 0; border-top: 1px solid rgba(255, 255, 255, 0.07); border-radius: 0; padding: 14px 0 4px; margin-bottom: 14px; background: none; }\n.trpg .dev-card.dev-off { opacity: .55; }\n.trpg .dev-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }\n.trpg .dev-name { font-weight: 600; font-size: 14px; color: var(--t-hi); }\n.trpg .dev-state { font: 600 9.5px/1.6 ui-monospace, Consolas, monospace; color: var(--safe); background: rgba(95, 214, 195, 0.10); border: 0; border-radius: 2px; padding: 0 6px; letter-spacing: .08em; white-space: nowrap; }\n.trpg .dev-off .dev-state { color: var(--t-low); background: rgba(255, 255, 255, 0.05); }\n.trpg .dev-where { margin-top: 10px; font-size: 15px; display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }\n.trpg .dev-loc { color: var(--t-hi); }\n.trpg .dev-mot { color: var(--t-mid); font-size: 12px; white-space: nowrap; }\n.trpg .dev-time { color: var(--t-low); font-size: 10px; margin-top: 3px; font-family: ui-monospace, Consolas, monospace; }\n.trpg .dev-feed { margin: 10px 0 0; padding: 0; list-style: none; font-size: 12px; color: var(--t-mid); }\n.trpg .dev-feed li { padding: 5px 0; border-top: 1px solid rgba(255, 255, 255, 0.06); }\n.trpg .dev-feed time { color: var(--t-low); font-size: 10px; font-family: ui-monospace, Consolas, monospace; margin-right: 10px; }\n.trpg .dev-note { margin: 8px 0 0; color: var(--t-low); font-size: 11px; line-height: 1.5; }\n.trpg .dev-frame { position: relative; margin-top: 12px; aspect-ratio: 16 / 9; border-radius: 4px; background: #05080c; border: 1px solid rgba(255, 255, 255, 0.06); overflow: hidden; }\n.trpg .dev-frame.no-feed { background: radial-gradient(ellipse at 32% 38%, #101820 0%, transparent 62%), radial-gradient(ellipse at 72% 68%, #0c1218 0%, transparent 55%), #05080c; }\n.trpg .dev-frame img { display: block; width: 100%; height: 100%; object-fit: cover; filter: saturate(.75) contrast(1.05); }\n/* 帧图未接入时是 hidden，但下面的 display:block 会盖掉 UA 的 [hidden] 规则，会把 alt 文字画出来 */\n.trpg .dev-frame img[hidden] { display: none !important; }\n.trpg .dev-frame::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg, #ffffff06 0 1px, transparent 1px 3px); }\n.trpg .dev-frame-cap { position: absolute; right: 6px; bottom: 5px; font: 10px ui-monospace, Consolas, monospace; color: #9fb6c4; background: #0d1216cc; padding: 1px 6px; border-radius: 2px; letter-spacing: .04em; }\n.trpg .dev-frame-rec { position: absolute; left: 7px; top: 6px; font: 9px ui-monospace, Consolas, monospace; color: #e0566a; letter-spacing: .12em; }\n.trpg .dev-frame-rec::before { content: ''; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #e0566a; margin-right: 5px; vertical-align: 1px; animation: rec-blink 1.6s steps(1) infinite; }\n@keyframes rec-blink { 50% { opacity: 0; } }\n.trpg .dev-sub { font-size: 10px; color: var(--muted); font-weight: 400; margin-left: 6px; }\n.trpg button[aria-pressed=\"true\"] { background: #354d43; border-color: #9ab7a4; }\n.trpg progress { display: block; width: 100%; height: 7px; margin-top: 10px; accent-color: #a4b9c9; }\n.trpg h3 { font-size: 12px; margin: 0 0 14px; color: var(--t-hi); letter-spacing: .02em; }\n.trpg .section-no { color: var(--t-low); font: 600 9.5px/1 ui-monospace, Consolas, monospace; letter-spacing: .16em; margin-right: 8px; }\n.trpg .money { display: flex; gap: 26px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }\n.trpg .money strong { font: 600 21px ui-monospace, Consolas, monospace; margin-left: 8px; color: var(--t-hi); }\n\n/* ═══ 战术终端 · 模块化呼吸感排版系统（C 案：无框卡片 + 顶发丝线） ═══ */\n.wx-player-banner {\n  background: rgba(255, 255, 255, 0.028);\n  border: 0;\n  border-top: 1px solid rgba(255, 255, 255, 0.07);\n  border-radius: 4px;\n  padding: 12px 14px 10px;\n  width: 100%;\n  box-sizing: border-box;\n}\n.wx-banner-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 10px;\n  margin-bottom: 10px;\n  padding-bottom: 8px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n}\n.wx-banner-title {\n  font-size: 12px;\n  color: var(--t-hi);\n  letter-spacing: .02em;\n}\n.wx-compact-money {\n  display: flex;\n  gap: 18px;\n  align-items: center;\n  margin: 0 !important;\n  padding: 0 !important;\n  border: none !important;\n}\n.wx-compact-money strong {\n  font: 650 17px ui-monospace, Consolas, monospace;\n  margin-left: 6px;\n  color: #e2edf8;\n}\n\n/* 玩家五维属性（实效值：基础+标签加值；绿=有增益，红=被削弱，悬停/长按看明细） */\n#wx-attrs, .trpg .attrs, .wx-attrs {\n  display: grid !important;\n  grid-template-columns: repeat(5, 1fr) !important;\n  gap: 8px !important;\n  margin-bottom: 8px !important;\n  min-height: 52px !important;\n  width: 100% !important;\n  box-sizing: border-box !important;\n}\n.trpg .attr {\n  position: relative !important;\n  text-align: center !important;\n  padding: 8px 4px 7px !important;\n  background: rgba(255, 255, 255, 0.03) !important;\n  border: 0 !important;\n  border-top: 1px solid rgba(255, 255, 255, 0.07) !important;\n  border-radius: 2px !important;\n  box-sizing: border-box !important;\n  transition: all .2s;\n}\n.trpg .attr .an {\n  font: 600 10px/1 ui-monospace, Consolas, monospace !important;\n  color: var(--t-low) !important;\n  letter-spacing: .14em !important;\n}\n.trpg .attr .av {\n  font: 600 20px ui-monospace, Consolas, monospace !important;\n  letter-spacing: -.02em !important;\n  margin-top: 4px !important;\n  color: var(--t-hi) !important;\n}\n.trpg .attr.hot .av, .trpg .attr .av.hot { color: var(--safe) !important; }\n.trpg .attr.weak .av, .trpg .attr .av.weak { color: #ff9aa3 !important; }\n.trpg .attr.eff-up { border-top-color: rgba(95, 214, 195, 0.45) !important; background: rgba(95, 214, 195, 0.05) !important; }\n.trpg .attr.eff-up .av { color: var(--safe) !important; }\n.trpg .attr.eff-down { border-top-color: rgba(255, 90, 104, 0.45) !important; background: rgba(255, 90, 104, 0.05) !important; }\n.trpg .attr.eff-down .av { color: #ff9aa3 !important; }\n\n/* ═══ 双翼战术工作区（左：行囊与生效修正；右：目标信号手账） ═══ */\n.wx-tactical-wings {\n  display: grid !important;\n  grid-template-columns: 1fr 1.25fr !important;\n  gap: 12px !important;\n  width: 100% !important;\n  box-sizing: border-box !important;\n}\n@media (max-width: 680px) {\n  .wx-tactical-wings {\n    grid-template-columns: 1fr !important;\n  }\n}\n.wx-wing-column {\n  min-width: 0;\n  display: flex;\n  flex-direction: column;\n}\n.wx-wing-card {\n  background: rgba(255, 255, 255, 0.028);\n  border: 0;\n  border-top: 1px solid rgba(255, 255, 255, 0.07);\n  border-radius: 4px;\n  padding: 12px 14px;\n  height: 100%;\n  box-sizing: border-box;\n}\n.wx-wing-card h3 {\n  font-size: 12px;\n  margin: 0 0 10px;\n  color: var(--t-hi);\n  letter-spacing: .02em;\n}\n.wx-active-tags-container {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n  min-height: 28px;\n}\n\n/* ═══ 环境战术沙盘面板 ═══ */\n.wx-terminal-envbox {\n  background: rgba(255, 255, 255, 0.028);\n  border: 0 !important;\n  border-top: 1px solid rgba(255, 255, 255, 0.07) !important;\n  border-radius: 4px;\n  padding: 12px 14px;\n  margin-top: 0 !important;\n  width: 100%;\n  box-sizing: border-box;\n}\n\n/* ═══ 底部深页导航与音频调控 ═══ */\n.wx-terminal-links {\n  display: flex !important;\n  justify-content: space-between !important;\n  align-items: center !important;\n  background: none;\n  border: 0 !important;\n  border-top: 1px solid rgba(255, 255, 255, 0.06) !important;\n  border-radius: 0;\n  padding: 10px 0 !important;\n  margin-top: 0 !important;\n  gap: 10px !important;\n  flex-wrap: wrap;\n  width: 100%;\n  box-sizing: border-box;\n}\n.wx-terminal-nav-buttons {\n  display: flex;\n  gap: 8px;\n  flex-wrap: wrap;\n  align-items: center;\n}\n.wx-terminal-nav-buttons button {\n  font-size: 11.5px !important;\n  padding: 4px 2px !important;\n  background: none !important;\n  border: 0 !important;\n  color: var(--t-mid) !important;\n}\n.wx-terminal-nav-buttons button:hover {\n  background: none !important;\n  border: 0 !important;\n  color: var(--t-hi) !important;\n}\n\n/* ═══ 沉底结算条 ═══ */\n/* 她的警觉：五格刻度 + 档位名，不报精确数值（数值只在悬停提示里给区间）\n   五格固定配色（主人定：2 绿 1 黄 1 橘 1 红），从下往上点亮＝警觉在涨 */\n.alert-pips { display: inline-flex; gap: 3px; align-items: center; margin-right: 6px; }\n.alert-pips i { width: 10px; height: 6px; border-radius: 1px; background: rgba(255, 255, 255, 0.10); display: block; }\n.alert-pips i:nth-child(1), .alert-pips i:nth-child(2) { --pip: #5fd6c3; }\n.alert-pips i:nth-child(3) { --pip: #f0c75e; }\n.alert-pips i:nth-child(4) { --pip: #f08a4b; }\n.alert-pips i:nth-child(5) { --pip: #ff5a68; }\n.alert-pips i.on { background: var(--pip, var(--heat)); }\n.alert-text { font: 600 11px/1 ui-monospace, Consolas, monospace; color: var(--t-mid); letter-spacing: .04em; }\n#alertRow[data-tier=\"3\"] .alert-text { color: #ff9aa3; }\n#alertRow[data-tier=\"4\"] .alert-text { color: var(--danger); }\n.wx-terminal-ledger {\n  background: none !important;\n  border: 0 !important;\n  border-top: 1px solid rgba(255, 255, 255, 0.06) !important;\n  border-radius: 0 !important;\n  padding: 8px 0 !important;\n  color: var(--t-mid) !important;\n  font-size: 11px !important;\n  margin-top: 0 !important;\n  box-sizing: border-box;\n  flex-shrink: 0;\n}\n/* 沉底结算条是弹窗页脚（不在滚动区内），左右留出与正文一致的边距；\n   选择器带 [data-tip] 压过 :1891 的「.trpg .ledger{margin-top:12px}」。 */\n.trpg .wx-terminal-ledger[data-tip] {\n  width: auto;\n  /* 左右与正文卡片的 18px 内边距对齐；底部留 14px（终端弹窗自身 padding 已归零） */\n  margin: 0 18px 14px;\n  box-shadow: 0 -6px 14px rgba(0, 0, 0, 0.45);\n}\n/* 全站悬停说明：仅限尾行组件内部带 data-tip 的元素，绝不干扰宿主与第三方扩展 */\n.trpg [data-tip], .wx-terminal-backdrop [data-tip], .wx-dialog [data-tip] { position: relative; }\n/* 收起态用 display:none 而不是 opacity:0——绝对定位的说明框即使透明也会计入\n   scrollWidth（实测常驻条因此虚胖 16px，窄屏上把整条顶出视口）。 */\n.trpg [data-tip]::after, .wx-terminal-backdrop [data-tip]::after, .wx-dialog [data-tip]::after {\n  content: attr(data-tip); display: none; position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);\n  background: #0b0f16; border: 1px solid #526577; padding: 6px 11px; border-radius: 4px;\n  font-size: 10.5px; color: #c8d3e8; white-space: pre-wrap; width: max-content; max-width: 320px;\n  text-align: left; line-height: 1.6; z-index: 10005;\n  pointer-events: none; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.85);\n}\n.trpg [data-tip]:hover::after, .trpg [data-tip]:active::after,\n.wx-terminal-backdrop [data-tip]:hover::after, .wx-terminal-backdrop [data-tip]:active::after,\n.wx-dialog [data-tip]:hover::after, .wx-dialog [data-tip]:active::after { display: block; }\n.slim-left [data-tip]::after { left: 0; transform: none; }\n.slim-right [data-tip]::after { left: auto; right: 0; transform: none; }\n#wx-attr-tags, .trpg .attr-tags { margin-bottom: 14px; display: flex; flex-wrap: wrap; gap: 6px; }\n#wx-attr-tags .tag, .trpg .attr-tags .tag { margin: 0; font-size: 11px; padding: 3px 8px; }\n/* ═══ 战术行囊持有物列表 ═══ */\n.wx-items, .trpg .items {\n  margin: 0 0 16px;\n  padding: 0;\n  list-style: none;\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  max-height: 240px;\n  overflow-y: auto;\n  scrollbar-width: thin;\n  scrollbar-color: #3b5066 #151d26;\n  padding-right: 4px;\n}\n.wx-items::-webkit-scrollbar, .trpg .items::-webkit-scrollbar {\n  width: 5px;\n}\n.wx-items::-webkit-scrollbar-track, .trpg .items::-webkit-scrollbar-track {\n  background: #151d26;\n  border-radius: 3px;\n}\n.wx-items::-webkit-scrollbar-thumb, .trpg .items::-webkit-scrollbar-thumb {\n  background: #3b5066;\n  border-radius: 3px;\n}\n.wx-items::-webkit-scrollbar-thumb:hover, .trpg .items::-webkit-scrollbar-thumb:hover {\n  background: #526f8d;\n}\n.wx-item-row {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 8px;\n  padding: 6px 0 6px 8px;\n  background: none;\n  border: 0;\n  border-left: 2px solid rgba(255, 255, 255, 0.10);\n  border-radius: 0;\n  transition: border-color .15s ease;\n}\n.wx-item-row:hover {\n  background: none;\n  border-left-color: rgba(255, 255, 255, 0.24);\n}\n.wx-item-left {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  min-width: 0;\n  flex-wrap: wrap;\n}\n.wx-item-type-badge {\n  font: 600 9.5px/1.5 ui-monospace, Consolas, monospace;\n  padding: 0;\n  border-radius: 0;\n  background: none;\n  color: var(--t-low);\n  border: 0;\n  letter-spacing: .1em;\n  white-space: nowrap;\n}\n.wx-item-name {\n  font-size: 11.5px;\n  color: var(--t-hi);\n  font-weight: 550;\n  white-space: nowrap;\n}\n.wx-item-count {\n  font-size: 11px;\n  color: var(--t-mid);\n  font-family: ui-monospace, Consolas, monospace;\n}\n.wx-item-equipped-pill {\n  font-size: 9.5px;\n  padding: 0 5px;\n  border-radius: 2px;\n  background: rgba(95, 214, 195, 0.10);\n  color: var(--safe);\n  border: 0;\n  border-left: 2px solid var(--safe);\n  font-weight: 600;\n  letter-spacing: .02em;\n}\n.wx-item-right {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  flex-shrink: 0;\n}\n.wx-item-btn {\n  font-size: 10.5px !important;\n  padding: 2px 8px !important;\n  border-radius: 2px !important;\n  border: 1px solid rgba(255, 255, 255, 0.14) !important;\n  background: none !important;\n  color: var(--t-mid) !important;\n  cursor: pointer;\n  line-height: 1.4 !important;\n  transition: border-color .15s, color .15s;\n}\n.wx-item-btn:hover {\n  background: none !important;\n  border-color: rgba(255, 255, 255, 0.3) !important;\n  color: var(--t-hi) !important;\n}\n.wx-item-btn.btn-equip {\n  border-color: rgba(95, 214, 195, 0.5) !important;\n  background: none !important;\n  color: var(--safe) !important;\n}\n.wx-item-btn.btn-equip:hover {\n  background: rgba(95, 214, 195, 0.08) !important;\n  border-color: rgba(95, 214, 195, 0.8) !important;\n}\n.wx-item-btn.btn-unequip {\n  border-color: rgba(255, 90, 104, 0.45) !important;\n  background: none !important;\n  color: #ff9aa3 !important;\n}\n.wx-item-btn.btn-unequip:hover {\n  background: rgba(255, 90, 104, 0.08) !important;\n  border-color: rgba(255, 90, 104, 0.75) !important;\n}\n.wx-item-btn.btn-use {\n  border-color: rgba(255, 255, 255, 0.18) !important;\n  background: none !important;\n  color: var(--t-mid) !important;\n}\n.wx-item-btn.btn-use:hover {\n  border-color: rgba(255, 255, 255, 0.34) !important;\n  color: var(--t-hi) !important;\n}\n.wx-item-empty {\n  padding: 12px 0;\n  text-align: center;\n  color: var(--t-low);\n  font-size: 11.5px;\n  list-style: none;\n}\n\n/* ═══ 标签体系（C 案：左侧 2px 色条 + 文字，不做胶囊） ═══ */\n.trpg .tag { display: inline-block; padding: 1px 0 1px 7px; border: 0; border-left: 2px solid var(--line); background: none; color: var(--t-mid); border-radius: 0; font-size: 11px; margin: 0 8px 6px 0; white-space: nowrap; }\n.trpg .tag.debuff { border-left-color: var(--danger); color: #ffa9b1; }\n.trpg .tag.target { border-left-color: var(--danger); color: #ffa9b1; }\n.trpg .tag.scene  { border-left-color: var(--t-mid); color: var(--t-mid); }\n.trpg .tag.advantage { border-left-color: var(--heat); color: #f4d6a0; text-shadow: none; }\n.preview-tools .replay-label { font: 11px ui-monospace, Consolas, monospace; color: #9fb5a0; white-space: nowrap; }\n.trpg .tag.personality { border-left-color: var(--her); color: #eec3cb; }\n.trpg .tag.hobby       { border-left-color: var(--her); color: #eec3cb; }\n.trpg .tag.equipment   { border-left-color: var(--her); color: #eec3cb; }\n.trpg .tag.fading { opacity: .65; }\n\n\n/* ═══ 接近度五档刻度进度轨 ═══ */\n.prox-container {\n  margin: 10px 0 16px;\n  background: none;\n  border: 0;\n  border-top: 1px solid rgba(255, 255, 255, 0.07);\n  border-radius: 0;\n  padding: 12px 0 14px;\n}\n.prox-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: baseline;\n  font-size: 12px;\n  color: var(--t-hi);\n  margin-bottom: 10px;\n  white-space: nowrap !important;\n}\n.prox-value-wrap {\n  font-size: 11px;\n  color: var(--t-mid);\n}\n.prox-value-wrap strong {\n  font: 600 18px ui-monospace, Consolas, monospace;\n  letter-spacing: -.02em;\n  color: var(--t-hi);\n  margin-right: 2px;\n}\n.prox-stage-badge {\n  color: var(--her);\n  font-weight: 600;\n  margin-left: 4px;\n}\n.prox-track-wrap {\n  position: relative;\n  padding: 8px 6px 20px;\n  cursor: help;\n}\n.prox-meter-bar {\n  width: 100%;\n  height: 3px;\n  background: #17222c;\n  border-radius: 1.5px;\n  overflow: hidden;\n  position: relative;\n}\n.prox-meter-fill {\n  height: 100%;\n  background: linear-gradient(90deg, rgba(231, 154, 168, .35), var(--her));\n  border-radius: 1.5px;\n  transition: width .3s ease;\n}\n.prox-nodes {\n  position: relative;\n  width: 100%;\n  margin-top: -5px;   /* 圆点 5px，让圆心骑在 3px 轨道中线上 */\n}\n.pnode {\n  position: absolute;\n  top: 0;\n  transform: translateX(-50%);\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  pointer-events: none;\n}\n.pnode .pdot {\n  width: 5px;\n  height: 5px;\n  border-radius: 50%;\n  background: #1a2530;\n  border: 1px solid #33465a;\n  transition: all .2s;\n}\n.pnode .plabel {\n  font: 500 9.5px/1 ui-monospace, Consolas, monospace;\n  color: var(--t-low);\n  margin-top: 5px;\n  white-space: nowrap;\n}\n.pnode.passed .pdot {\n  background: #3f5568;\n  border-color: #5d7b93;\n}\n.pnode.passed .plabel {\n  color: var(--t-mid);\n}\n.pnode.active .pdot {\n  background: var(--her);\n  border-color: #ffe3ea;\n  box-shadow: 0 0 9px rgba(231, 154, 168, 0.85);\n  transform: scale(1.35);\n}\n.pnode.active .plabel {\n  color: var(--her);\n  font-weight: 600;\n}\n.trpg .timeline { list-style: none; margin: 0 0 18px; padding: 0; }\n.trpg .timeline li { display: flex; gap: 12px; margin: 0 0 0 3px; padding: 3px 0 15px 15px; border-left: 1px solid rgba(255, 255, 255, 0.08); position: relative; color: var(--t-mid); }\n.trpg .timeline li::before { content: ''; position: absolute; width: 5px; height: 5px; border-radius: 50%; background: var(--t-low); left: -3px; top: 10px; }\n.trpg time { color: var(--t-low); font-family: ui-monospace, Consolas, monospace; font-size: 10px; flex-shrink: 0; }\n.trpg .assessment { font-size: 12px; margin: 14px 0 0; padding: 2px 0 2px 10px; border-left: 2px solid var(--heat); background: none; color: #e9d3ad; }\n/* ═══ 动线推进雷达轨（常驻层） ═══ */\n.route-tracker {\n  position: relative;\n  overflow: hidden;\n  background: rgba(255, 255, 255, 0.024);\n  border-bottom: 0;\n  padding: 10px 14px 12px;\n  border-top-left-radius: 4px;\n  border-top-right-radius: 4px;\n}\n.route-weather-fx {\n  position: absolute;\n  inset: 0;\n  pointer-events: none;\n  z-index: 0;\n  opacity: 0;\n  transition: opacity 0.5s ease;\n}\n.route-meta, .route-stepper {\n  position: relative;\n  z-index: 1;\n}\n/* 雨天：斜向细雨丝微流动 */\n.route-tracker.is-rain .route-weather-fx {\n  opacity: 0.22;\n  background-image: repeating-linear-gradient(\n    110deg,\n    transparent,\n    transparent 11px,\n    rgba(140, 190, 240, 0.45) 12px,\n    transparent 13px\n  );\n  background-size: 40px 40px;\n  animation: route-rain-anim 0.85s linear infinite;\n}\n/* 暴雨：雨丝密集加急 */\n.route-tracker.is-storm .route-weather-fx {\n  opacity: 0.38;\n  background-image: repeating-linear-gradient(\n    118deg,\n    transparent,\n    transparent 7px,\n    rgba(170, 215, 255, 0.7) 8px,\n    transparent 9px\n  );\n  background-size: 30px 30px;\n  animation: route-rain-anim 0.42s linear infinite;\n}\n/* 晴夜：微弱路灯钠黄光晕 */\n.route-tracker.is-clear .route-weather-fx {\n  opacity: 0.15;\n  background: radial-gradient(ellipse at 80% 20%, rgba(245, 212, 131, 0.45) 0%, transparent 65%);\n}\n@keyframes route-rain-anim {\n  0% { background-position: 0 0; }\n  100% { background-position: -40px 80px; }\n}\n@media (prefers-reduced-motion: reduce) {\n  .route-tracker.is-rain .route-weather-fx,\n  .route-tracker.is-storm .route-weather-fx { animation: none; }\n}\n.route-meta {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 8px;\n  font-size: 11.5px;\n  margin-bottom: 7px;\n}\n.route-title {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  color: #dce6ee;\n  font-weight: 600;\n}\n.route-dist-badge {\n  background: #253342;\n  border: 1px solid #4a637b;\n  color: #9ebfdc;\n  padding: 1px 6px;\n  border-radius: 3px;\n  font-size: 10px;\n  font-weight: normal;\n}\n.route-status-tags {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 10.5px;\n}\n/* 微型步进轨（C4：图标改成 20px 圆盘承载 12px 单色图标，不再是 emoji 撑破 8px 圆点） */\n.route-stepper {\n  display: flex;\n  align-items: center;\n  width: 100%;\n  padding: 6px 0 4px;\n}\n.step-item {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 10.5px;\n  color: var(--t-low);\n  white-space: nowrap;\n}\n.step-dot {\n  width: 20px;\n  height: 20px;\n  border-radius: 50%;\n  border: 1px solid rgba(255, 255, 255, 0.12);\n  background: rgba(255, 255, 255, 0.04);\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  transition: border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;\n}\n.step-item.passed .step-dot {\n  background: rgba(255, 255, 255, 0.05);\n  border-color: rgba(255, 255, 255, 0.10);\n}\n.step-item.passed {\n  color: var(--t-low);\n}\n.step-item.passed .step-ico {\n  opacity: .45;\n}\n.step-item.current {\n  color: var(--heat);\n  font-weight: 600;\n}\n.step-item.current .step-dot {\n  background: rgba(240, 179, 85, 0.14);\n  border-color: rgba(240, 179, 85, 0.55);\n  animation: step-breathe 2.2s ease-in-out infinite;\n}\n.step-item.current .step-ico {\n  opacity: 1;\n  color: var(--heat);\n}\n/* 当前节点呼吸高亮：光晕一涨一落，机会窗口正在流逝的搏动感 */\n@keyframes step-breathe {\n  0%, 100% { box-shadow: 0 0 4px rgba(240, 179, 85, 0.35); }\n  50%      { box-shadow: 0 0 13px rgba(240, 179, 85, 0.85); }\n}\n.step-item.terminal .step-dot {\n  border-radius: 4px;\n  border-color: rgba(255, 255, 255, 0.12);\n}\n.step-item.terminal.current .step-dot {\n  background: rgba(255, 90, 104, 0.16);\n  border-color: rgba(255, 90, 104, 0.60);\n  animation: step-breathe-red 2.2s ease-in-out infinite;\n}\n@keyframes step-breathe-red {\n  0%, 100% { box-shadow: 0 0 4px rgba(255, 90, 104, 0.35); }\n  50%      { box-shadow: 0 0 13px rgba(255, 90, 104, 0.85); }\n}\n@media (prefers-reduced-motion: reduce) {\n  .step-item.current .step-dot,\n  .step-item.terminal.current .step-dot { animation: none; }\n}\n.step-item.unknown {\n  color: var(--t-low);\n}\n.step-item.unknown .step-dot {\n  border-style: dashed;\n  border-color: rgba(255, 255, 255, 0.12);\n  background: rgba(255, 255, 255, 0.02);\n}\n.step-item.unknown .step-ico {\n  opacity: .35;\n}\n.step-item.unknown .step-name {\n  font-weight: 700;\n  color: var(--t-low);\n}\n.step-line {\n  flex: 1;\n  height: 1px;\n  background: rgba(255, 255, 255, 0.08);\n  min-width: 14px;\n  margin: 0 6px;\n}\n.step-line.passed {\n  background: rgba(255, 255, 255, 0.18);\n}\n.step-line.future {\n  background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.14) 3px, transparent 3px, transparent 7px);\n}\n\n/* ═══ 抽屉层 · 战术沙盘面板 ═══ */\n.envbox {\n  margin-top: 16px;\n  border-top: 1px solid rgba(255, 255, 255, 0.06);\n  padding-top: 14px;\n}\n.env-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: baseline;\n  font-size: 13px;\n  color: var(--t-hi);\n  margin-bottom: 8px;\n}\n.env-header .fam {\n  color: var(--t-mid);\n  font: 600 10px/1 ui-monospace, Consolas, monospace;\n  letter-spacing: .06em;\n}\n.env-fam-bar {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font-size: 11px;\n  color: var(--muted);\n  margin-bottom: 10px;\n}\n.fam-meter {\n  flex: 1;\n  height: 3px;\n  background: #17222c;\n  border-radius: 1.5px;\n  overflow: hidden;\n}\n.fam-fill {\n  display: block;\n  height: 100%;\n  background: var(--safe);\n  border-radius: 1.5px;\n}\n.tactical-grid {\n  background: none;\n  border: 0;\n  border-top: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: 0;\n  padding: 10px 0 0;\n  margin-top: 8px;\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  font-size: 11.5px;\n}\n.tactical-row {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n}\n.tactical-label {\n  color: var(--t-low);\n  min-width: 68px;\n  flex-shrink: 0;\n}\n.tactical-chips {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 5px;\n}\n.chip {\n  padding: 2px 8px;\n  border-radius: 3px;\n  font-size: 11px;\n  display: inline-flex;\n  align-items: center;\n  background: rgba(255, 255, 255, 0.045);\n  border: 0;\n  color: var(--t-mid);\n}\n.chip-ico {\n  display: inline-block;\n  margin-right: 4px;\n  font-weight: 700;\n  font-size: 10px;\n  opacity: .85;\n}\n.chip-exit {\n  background: rgba(255, 255, 255, 0.045);\n  border: 0;\n  color: var(--t-mid);\n}\n.chip-spot {\n  background: rgba(240, 179, 85, 0.08);\n  border: 0;\n  color: #e8c98d;\n}\n.chip-sanctuary {\n  background: rgba(255, 90, 104, 0.10);\n  border: 0;\n  color: #ffa9b1;\n}\n.chip-sanctuary .chip-ico {\n  color: #ff7588;\n  animation: rec-blink 1.2s infinite;\n}\n.step-ico {\n  line-height: 1;\n  opacity: .8;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n}\n.step-item.passed .step-ico {\n  opacity: .45;\n}\n.step-item.current .step-ico {\n  opacity: 1;\n  color: var(--heat);\n}\n.step-item.unknown .step-ico {\n  opacity: .35;\n}\n.envtags {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n  margin: 6px 0 10px;\n}\n.envtag {\n  display: inline-block;\n  padding: 2.5px 8px;\n  border: 1px solid #4a6a8a;\n  border-left: 3px solid #6fa8d6;\n  background: #22303f;\n  color: #c6dcee;\n  border-radius: 3px;\n  font-size: 11px;\n}\n/* ═══ 底部深页与音频综合调控 ═══ */\n.trpg .links {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  border-top: 1px solid var(--border);\n  margin-top: 18px;\n  padding-top: 12px;\n  position: relative;\n  gap: 10px;\n}\n.links-left {\n  display: flex;\n  gap: 8px;\n  flex-wrap: wrap;\n  align-items: center;\n}\n.audio-popover-wrap {\n  position: relative;\n  display: inline-flex;\n  align-items: center;\n  margin-left: auto;\n}\n.audio-menu-btn {\n  background: #18222d;\n  border: 1px solid #36495d;\n  border-radius: 4px;\n  padding: 3px 9px;\n  cursor: pointer;\n  color: #cad8e6;\n  font-size: 11px;\n  min-height: 25px;\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  transition: all .15s;\n}\n.audio-menu-btn:hover {\n  background: #233142;\n  border-color: #55779c;\n  color: #fff;\n}\n.audio-menu-btn.active {\n  background: #25384d;\n  border-color: #6a96c7;\n  color: #8fc2f5;\n  box-shadow: 0 0 8px rgba(106, 150, 199, 0.35);\n}\n.audio-popover-panel {\n  position: absolute;\n  bottom: calc(100% + 8px);\n  right: 0;\n  width: 200px;\n  background: #141d27;\n  border: 1px solid #3b5066;\n  border-radius: 6px;\n  padding: 10px 12px;\n  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);\n  z-index: 10001;\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  animation: popover-up .15s ease-out;\n}\n.audio-popover-head {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  border-bottom: 1px solid #283748;\n  padding-bottom: 6px;\n}\n.audio-popover-title {\n  font-size: 11px;\n  font-weight: 600;\n  color: #a4b9c9;\n}\n.audio-master-switch {\n  font-size: 10px !important;\n  padding: 2px 7px !important;\n  min-height: 22px !important;\n  background: #212c38 !important;\n  border: 1px solid #3d5064 !important;\n  color: #c7d5e2 !important;\n  border-radius: 3px !important;\n  cursor: pointer;\n}\n.audio-master-switch[aria-pressed=\"true\"] {\n  background: #233e32 !important;\n  border-color: #4d7a63 !important;\n  color: #9ee0bd !important;\n}\n.audio-sliders-group {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n.audio-slider-item {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  font-size: 10.5px;\n  color: #9ab0c2;\n  gap: 8px;\n}\n.audio-slider-item input[type=range] {\n  width: 110px;\n  accent-color: #df9ba8;\n  cursor: pointer;\n}\n.audio-popover-status {\n  font-size: 10px;\n  color: #7b8f9f;\n  text-align: right;\n  border-top: 1px dashed #2b3a4a;\n  padding-top: 5px;\n}\n/* 她的动静警示槽（常驻条右上角，过档事件亮两段） */\n.trpg { position: relative; }\n/* 全屏/状态栏边缘应激暗角（Vignette） */\n.trpg-vignette {\n  position: absolute;\n  inset: 0;\n  border-radius: 8px;\n  pointer-events: none;\n  z-index: 7;\n  transition: box-shadow 0.4s ease;\n  box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.35);\n}\n/* 变形态：边缘暗红收窄 */\n.trpg[data-line=\"deform\"] .trpg-vignette {\n  box-shadow: inset 0 0 38px rgba(175, 45, 55, 0.38);\n}\n/* 崩溃态：深红逼近 + 随心跳重拍搏动 */\n.trpg[data-line=\"crash\"] .trpg-vignette {\n  box-shadow: inset 0 0 54px rgba(225, 35, 50, 0.62);\n  animation: vignette-throb var(--beat, 0.8s) ease-in-out infinite;\n}\n@keyframes vignette-throb {\n  0%, 100% { box-shadow: inset 0 0 44px rgba(190, 30, 45, 0.5); }\n  50%      { box-shadow: inset 0 0 66px rgba(245, 40, 60, 0.78); }\n}\n/* 结算 spike 重拍脉冲 */\n.trpg-vignette.pulse {\n  animation: vignette-pulse 0.45s ease-out forwards;\n}\n@keyframes vignette-pulse {\n  0%   { box-shadow: inset 0 0 78px rgba(255, 45, 60, 0.88); }\n  100% { box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.35); }\n}\n@media (prefers-reduced-motion: reduce) {\n  .trpg[data-line=\"crash\"] .trpg-vignette,\n  .trpg-vignette.pulse { animation: none; }\n}\n.her-alert { position: absolute; top: -12px; right: 16px; z-index: 9; padding: 3px 12px; border-radius: 10px;\n  background: #392b2f; border: 1px solid #7a5a60; color: #e3c3ca; font-size: 12px; letter-spacing: .1em;\n  box-shadow: 0 2px 10px #0007; opacity: 0; transform: translateY(-5px); transition: .35s; pointer-events: none; }\n.her-alert.show { opacity: 1; transform: none; }\n/* 心跳历史迷你曲线 */\n.spark { display: block; width: min(100%, 164px); height: 20px; margin-top: 7px; }\n.spark polyline { fill: none; stroke: #6fd3c7; stroke-width: 1.5; filter: drop-shadow(0 0 3px rgba(111,211,199,.45)); }\n.spark line { stroke: rgba(146,187,154,.4); stroke-width: 1; stroke-dasharray: 2 3; }\n/* 接触模式：距离 pip 换暖色（朋友的位，不是贼的位） */\n.pips.warm .pip.active { background: #d6b96a; border-color: #d6b96a; }\n/* 标签将到期 */\n.trpg .tag.fading { opacity: .55; }\n/* 谎账：雷区可视化 */\n.lie { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 12.5px; border-top: 1px dashed #465463; }\n.lie:first-child { border-top: 0; }\n.lie .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; animation: blink 1.2s steps(2) infinite; }\n.lie.v-high .dot { background: #e0566a; }\n.lie.v-mid .dot { background: #d6b96a; }\n.lie.v-low .dot { background: #8b93a0; animation: none; }\n.lie.busted { opacity: .45; text-decoration: line-through; }\n.lie .ver { margin-left: auto; font-size: 10px; color: var(--muted); }\n/* 她的档案：属性直读区（高情报揭示真实数值，未查明显示 ?） */\n.pattrs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }\n.pattr { text-align: center; padding: 8px 0 7px; background: rgba(255, 255, 255, 0.03); border: 0; border-top: 1px solid rgba(255, 255, 255, 0.07); border-radius: 2px; }\n.pattr .an { font: 600 10px/1 ui-monospace, Consolas, monospace; color: var(--t-low); letter-spacing: .14em; }\n.pattr .av { font: 600 19px ui-monospace, Consolas, monospace; margin-top: 4px; color: var(--t-hi); }\n.pattr.unknown .av { color: var(--t-low); }\n.pattr .at { font: 500 9.5px ui-monospace, Consolas, monospace; color: var(--t-mid); margin-top: 3px; }\n\n/* ═══ 她的档案 · 长焦偷拍取景框 ═══ */\n.surv-viewfinder {\n  margin-bottom: 16px;\n  background: #090e15;\n  border: 1px solid #2b3a4a;\n  border-radius: 6px;\n  padding: 8px;\n  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.4);\n}\n.vf-frame {\n  position: relative;\n  background: #0d131b;\n  border: 1px solid #1f2a36;\n  border-radius: 4px;\n  overflow: hidden;\n  display: flex;\n  flex-direction: column;\n}\n.vf-corner {\n  position: absolute;\n  width: 9px;\n  height: 9px;\n  border: 1.5px solid #63809e;\n  z-index: 5;\n  pointer-events: none;\n}\n.vf-corner.tl { top: 6px; left: 6px; border-right: 0; border-bottom: 0; }\n.vf-corner.tr { top: 6px; right: 6px; border-left: 0; border-bottom: 0; }\n.vf-corner.bl { bottom: 6px; left: 6px; border-right: 0; border-top: 0; }\n.vf-corner.br { bottom: 6px; right: 6px; border-left: 0; border-top: 0; }\n.vf-crosshair {\n  position: absolute;\n  top: 50%; left: 50%;\n  width: 22px; height: 22px;\n  transform: translate(-50%, -50%);\n  border: 1px dashed rgba(111, 211, 199, 0.35);\n  border-radius: 50%;\n  pointer-events: none;\n  z-index: 4;\n}\n.vf-crosshair::before, .vf-crosshair::after {\n  content: ''; position: absolute; background: rgba(111, 211, 199, 0.45);\n}\n.vf-crosshair::before { top: 50%; left: -6px; width: 34px; height: 1px; transform: translateY(-50%); }\n.vf-crosshair::after { left: 50%; top: -6px; height: 34px; width: 1px; transform: translateX(-50%); }\n.vf-header {\n  position: absolute;\n  top: 6px; left: 16px; right: 16px;\n  display: flex; justify-content: space-between; align-items: center;\n  font: 9.5px ui-monospace, Consolas, monospace;\n  color: #9cb3c7;\n  z-index: 6;\n  text-shadow: 0 1px 3px #000;\n  pointer-events: none;\n}\n.vf-rec {\n  color: #e0566a;\n  letter-spacing: .08em;\n  font-weight: 600;\n  display: flex; align-items: center; gap: 4px;\n}\n.vf-rec .rec-dot {\n  display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #e0566a;\n  box-shadow: 0 0 5px #e0566a;\n  animation: rec-blink 1.4s steps(1) infinite;\n}\n.vf-meta {\n  color: #6d859a;\n  font-size: 9px;\n}\n.vf-scene {\n  position: relative;\n  width: 100%;\n  height: 130px;\n  overflow: hidden;\n  background: #080d14;\n}\n.vf-canvas {\n  display: block;\n  width: 100%;\n  height: 100%;\n  filter: contrast(1.1) saturate(0.85);\n  transition: filter 0.4s ease;\n}\n/* 距离虚化 */\n.vf-frame.af-searching .vf-canvas {\n  filter: blur(2.5px) contrast(0.95) saturate(0.65);\n}\n.vf-frame.af-tracking .vf-canvas {\n  filter: blur(1.2px) contrast(1.05) saturate(0.8);\n}\n.vf-frame.af-locked .vf-canvas {\n  filter: blur(0px) contrast(1.15) saturate(0.9);\n}\n/* 对焦微标 */\n.vf-af-badge {\n  padding: 1px 5px;\n  border-radius: 2px;\n  font-weight: 700;\n  letter-spacing: .05em;\n  font-size: 8.5px;\n  margin-left: 6px;\n}\n.vf-frame.af-searching .vf-af-badge {\n  color: #dfba68;\n  background: rgba(223, 186, 104, 0.16);\n  border: 1px solid rgba(223, 186, 104, 0.45);\n}\n.vf-frame.af-tracking .vf-af-badge {\n  color: #8bb8dc;\n  background: rgba(139, 184, 220, 0.16);\n  border: 1px solid rgba(139, 184, 220, 0.45);\n}\n.vf-frame.af-locked .vf-af-badge {\n  color: #72cf9c;\n  background: rgba(114, 207, 156, 0.16);\n  border: 1px solid rgba(114, 207, 156, 0.45);\n}\n/* 心跳手抖 */\n.vf-frame.shake-deform .vf-canvas {\n  animation: vf-shake-light 0.18s infinite alternate ease-in-out;\n}\n.vf-frame.shake-crash .vf-canvas {\n  animation: vf-shake-heavy 0.12s infinite alternate ease-in-out;\n}\n@keyframes vf-shake-light {\n  0%   { transform: translate(0, 0) rotate(0deg); }\n  100% { transform: translate(0.7px, -0.6px) rotate(0.25deg); }\n}\n@keyframes vf-shake-heavy {\n  0%   { transform: translate(-1.2px, 0.9px) rotate(-0.45deg); }\n  50%  { transform: translate(1.3px, -1.1px) rotate(0.55deg); }\n  100% { transform: translate(-0.8px, -1px) rotate(-0.35deg); }\n}\n@media (prefers-reduced-motion: reduce) {\n  .vf-frame.shake-deform .vf-canvas,\n  .vf-frame.shake-crash .vf-canvas { animation: none; }\n}\n.vf-scanline {\n  position: absolute;\n  inset: 0;\n  pointer-events: none;\n  background: repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.02) 0 1px, transparent 1px 3px);\n  opacity: 0.7;\n}\n.vf-footer {\n  position: absolute;\n  bottom: 6px; left: 16px; right: 16px;\n  display: flex; justify-content: space-between; align-items: center;\n  font: 9px ui-monospace, Consolas, monospace;\n  color: #6b8296;\n  z-index: 6;\n  text-shadow: 0 1px 3px #000;\n  pointer-events: none;\n}\n.vf-tag {\n  color: #9ab4cb;\n}\n.vf-status {\n  color: #8faea0;\n}\n\n.lie-legend { display: flex; gap: 16px; font-size: 11px; color: var(--muted); margin-bottom: 10px; align-items: center; }\n.lie-legend .dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 5px; vertical-align: 1px; }\n@keyframes blink { 50% { opacity: .15; } }\n.trpg .ledger { border-top: 1px solid var(--border); padding: 8px 14px; color: var(--muted); background: #1f2730; border-radius: 0 0 7px 7px; font-size: 11px; margin-top: 12px; }\n/* ═══ 全局 Dialog 浮层弹窗加固（统一 TRPG 暗色风格） ═══ */\n/* ═══ 尾行专属 Dialog 浮层弹窗加固（统一 TRPG 暗色风格，绝不污染宿主与第三方扩展） ═══ */\n/* 终端弹窗排除在外：它自带 header/body 分区，padding 由 :599 定 0。\n   此前两条 !important 特异性打平、靠源码顺序分胜负，终端被套上 20/22 内边距。 */\ndialog.wx-dialog:not(.wx-terminal-dialog), .trpg dialog.wx-dialog:not(.wx-terminal-dialog) {\n  background: #070b10 !important;\n  color: var(--t-hi) !important;\n  border: 0 !important;\n  border-top: 1px solid rgba(240, 179, 85, 0.22) !important;\n  padding: 20px 22px !important;\n  border-radius: 10px !important;\n  width: min(580px, calc(100% - 28px)) !important;\n  max-height: 85dvh !important;\n  overflow: auto !important;\n  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.95) !important;\n  box-sizing: border-box !important;\n}\ndialog.wx-dialog::backdrop, .trpg dialog.wx-dialog::backdrop {\n  background: rgba(5, 10, 16, 0.85) !important;\n  backdrop-filter: blur(6px) !important;\n  -webkit-backdrop-filter: blur(6px) !important;\n}\ndialog.wx-dialog[open], .trpg dialog.wx-dialog[open] { animation: dialog-in 160ms ease-out; }\ndialog.wx-dialog h2, .trpg dialog.wx-dialog h2 { font-size: 16px; margin-top: 0; color: var(--t-hi); letter-spacing: .02em; }\n.wx-dialog .dialog-top, .trpg .wx-dialog .dialog-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); margin-bottom: 16px; }\n.wx-dialog .dialog-top h2, .trpg .wx-dialog .dialog-top h2 { margin-bottom: 10px; }\n.wx-dialog .close-icon, .trpg .wx-dialog .close-icon {\n  min-width: 32px; padding: 2px 8px; font-size: 17px; line-height: 1; cursor: pointer;\n  background: transparent !important; border: 0 !important; color: var(--t-mid) !important; transition: color .15s;\n}\n.wx-dialog .close-icon:hover, .trpg .wx-dialog .close-icon:hover { color: #fff !important; }\n.wx-dialog .dialog-actions, .trpg .wx-dialog .dialog-actions { display: flex; justify-content: flex-end; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 14px; margin-top: 18px; }\ndialog.wx-dialog button, .trpg dialog.wx-dialog button, .wx-terminal-modal button {\n  font: inherit !important; color: #d9e4ed !important; background: #26333e !important; border: 1px solid #4a5d70 !important; border-radius: 5px !important; padding: 4px 12px !important; cursor: pointer !important; min-height: 28px !important; transition: all .15s !important;\n}\n/* 关闭键不吃通用按钮皮：它必须排在 :1969 之后、且特异性更高（dialog + 两class） */\ndialog.wx-dialog .wx-modal-close, dialog.wx-dialog .close-icon,\n.trpg dialog.wx-dialog .wx-modal-close, .trpg dialog.wx-dialog .close-icon {\n  background: transparent !important;\n  border: 0 !important;\n  border-radius: 0 !important;\n  min-height: 0 !important;\n  padding: 4px 8px !important;\n  color: var(--t-mid) !important;\n  font-size: 17px !important;\n}\ndialog.wx-dialog .wx-modal-close:hover, dialog.wx-dialog .close-icon:hover,\n.trpg dialog.wx-dialog .wx-modal-close:hover, .trpg dialog.wx-dialog .close-icon:hover {\n  background: transparent !important;\n  border: 0 !important;\n  color: #ffffff !important;\n}\ndialog.wx-dialog button:hover, .trpg dialog.wx-dialog button:hover, .wx-terminal-modal button:hover { background: #354757 !important; border-color: #8da6bd !important; color: #fff !important; }\n.trpg .item-meta { color: #afc3d2; font-size: 12px; }\n.trpg .dice { font: 700 30px/1.6 ui-monospace, Consolas, monospace; margin: 15px 0; }\n.trpg .success { color: #b3cdb8; }\n@keyframes beat { 0%, 35%, 100% { transform: scale(1); } 12% { transform: scale(1.18); } }\n@keyframes ring-beat { 0%, 40%, 100% { stroke-opacity: .08; stroke-width: 1; } 12% { stroke-opacity: .65; stroke-width: 2.5; } }\n@keyframes dialog-in { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }\n@keyframes ecg-scroll { from { transform: translateX(0); } to { transform: translateX(-72px); } }\n.trpg.motion-paused .dial-heart, .trpg.motion-paused .dial-beat-halo, .trpg.motion-paused .ecg-scroll { animation-play-state: paused; }\n@media (prefers-reduced-motion: reduce) {\n  .trpg .dial-heart, .trpg .dial-beat-halo, .trpg .ecg-scroll, .trpg dialog.wx-dialog[open] { animation: none; }\n  .trpg .dial-marker-orbit, .trpg .stamina-fill { transition: none; }\n  .trpg .dev-frame-rec::before { animation: none; }\n}\n/* ═══ 零楼 · 开局两步走向导（第一步：猎手身份属性 ➔ 第二步：锁定目标角色；零楼数零 token） ═══ */\ndialog.wx-dialog.wx-create-dialog { width: min(820px, calc(100% - 24px)) !important; max-height: min(92vh, 820px) !important; display: flex; flex-direction: column; }\n/* 关闭态一律不占版面：作者态的 display:flex 会盖过 UA 的 dialog:not([open]){display:none}，\n   导致创角向导 close() 之后仍占 399px 版面（真机实测）。 */\ndialog.wx-dialog:not([open]) { display: none !important; }\n.zero-wizard-top { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06); padding-bottom: 12px; margin-bottom: 14px; gap: 12px; flex-wrap: wrap; }\n.zero-title-wrap { display: flex; align-items: baseline; gap: 8px; }\n#wx-create-dialog .zero-title-wrap h2 { font-size: 15px; font-weight: 600; color: var(--t-hi); letter-spacing: .02em; }\n.zero-sub { color: var(--t-low); font: 500 10px/1.5 ui-monospace, Consolas, monospace; letter-spacing: .06em; }\n.zero-steps-bar { display: flex; align-items: center; gap: 8px; }\n/* 步骤药丸与页签都在创角弹窗里，统一带 #wx-create-dialog 作用域：\n   宿主通用按钮皮是 `.trpg dialog.wx-dialog button`（0,2,2），单类前缀（0,2,0）压不住。 */\n#wx-create-dialog .zero-step-pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 0 !important; background: none !important; border: 0 !important; border-radius: 0 !important; color: var(--t-low) !important; font: 600 10px/1 ui-monospace, Consolas, monospace !important; letter-spacing: .12em; cursor: pointer; transition: color .15s; }\n#wx-create-dialog .zero-step-pill .step-num { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; background: none !important; border: 1px solid rgba(255, 255, 255, 0.16) !important; color: var(--t-low) !important; font-size: 9.5px; font-weight: 700; }\n#wx-create-dialog .zero-step-pill.active { color: var(--heat) !important; }\n#wx-create-dialog .zero-step-pill.active .step-num { background: var(--heat) !important; border-color: var(--heat) !important; color: #0b0f14 !important; }\n#wx-create-dialog .zero-step-pill.completed { color: var(--safe) !important; }\n#wx-create-dialog .zero-step-pill.completed .step-num { border-color: rgba(95, 214, 195, 0.5) !important; color: var(--safe) !important; }\n.zero-step-divider { color: var(--t-low); opacity: .5; font-size: 11px; }\n\n.zero-step-view { display: flex; flex-direction: column; min-height: 0; }\n.zero-step-view[hidden] { display: none; }\n\n#wx-create-dialog .create-tabs { display: flex; gap: 8px; margin: 0 0 14px; }\n#wx-create-dialog .create-tab { background: none !important; border: 0 !important; border-radius: 0 !important; color: var(--t-low) !important; padding: 4px 0 !important; margin-right: 16px; font: 600 10px/1 ui-monospace, Consolas, monospace !important; letter-spacing: .12em; }\n#wx-create-dialog .create-tab.active { background: none !important; color: var(--heat) !important; box-shadow: inset 0 -2px 0 var(--heat); }\n#wx-create-dialog .create-pane[hidden] { display: none; }\n#wx-create-dialog .id-grid, #wx-create-dialog .preset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px; max-height: 290px; overflow-y: auto; padding-right: 4px; }\n#wx-create-dialog .id-card { text-align: left; background: rgba(255, 255, 255, 0.028) !important; border: 0 !important; border-top: 1px solid rgba(255, 255, 255, 0.07) !important; border-radius: 4px !important; cursor: pointer; display: flex; flex-direction: column; gap: 4px; min-height: 0; transition: background-color .15s; }\n#wx-create-dialog .id-card:hover { background: rgba(255, 255, 255, 0.055) !important; }\n#wx-create-dialog .id-card.sel { background: rgba(240, 179, 85, 0.07) !important; border-top-color: var(--heat) !important; }\n#wx-create-dialog .id-name { font-size: 15px; font-weight: 600; color: var(--t-hi); }\n#wx-create-dialog .id-tagline { font-size: 11px; color: var(--t-mid); font-style: italic; }\n#wx-create-dialog .id-line { font-size: 11px; color: var(--t-mid); line-height: 1.55; }\n#wx-create-dialog .id-line b { color: var(--safe); font-weight: 600; }\n#wx-create-dialog .id-line.bad b { color: #ff9aa3; }\n#wx-create-dialog .alloc { margin-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 10px; }\n#wx-create-dialog .alloc-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; gap: 10px; }\n#wx-create-dialog .alloc-remain { font: 600 15px/1 ui-monospace, Consolas, monospace; color: var(--heat); white-space: nowrap; }\n#wx-create-dialog .alloc-remain.warn { color: #ff9aa3; }\n#wx-create-dialog .alloc-row { display: grid; grid-template-columns: 44px auto 96px 1fr; align-items: center; gap: 10px; padding: 4px 0; }\n#wx-create-dialog .alloc-name { font-size: 13px; font-weight: 600; color: var(--t-hi); }\n#wx-create-dialog .stepper { display: flex; align-items: center; gap: 6px; }\n#wx-create-dialog .stepper button { background: rgba(255, 255, 255, 0.05) !important; border: 0 !important; border-radius: 2px !important; color: var(--t-mid) !important; }\n#wx-create-dialog .stepper button:disabled { opacity: .35; cursor: not-allowed; }\n#wx-create-dialog .alloc-val { font: 600 19px/1 ui-monospace, Consolas, monospace; color: var(--t-hi); text-align: center; min-width: 30px; }\n#wx-create-dialog .alloc-mod { font: 600 11px/1.3 ui-monospace, Consolas, monospace; color: var(--safe); text-align: center; white-space: nowrap; }\n#wx-create-dialog .alloc-mod.waste { color: #ff9aa3; }\n#wx-create-dialog .alloc-tier { font-size: 11px; color: var(--t-low); }\n#wx-create-dialog .alloc-warn { color: #ff9aa3; font-size: 11px; margin: 4px 0 0; min-height: 15px; }\n\n/* 步骤 2：目标卡片网格与详情 */\n.target-section-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; gap: 10px; flex-wrap: wrap; }\n.target-sub-note { font-size: 11px; color: #7fd4c1; }\n.target-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; max-height: 300px; overflow-y: auto; padding-right: 4px; }\n#wx-create-dialog .target-card { text-align: left; background: rgba(255, 255, 255, 0.028) !important; border: 0 !important; border-top: 1px solid rgba(255, 255, 255, 0.07) !important; border-radius: 4px !important; cursor: pointer; display: flex; flex-direction: column; gap: 4px; transition: background-color .15s; }\n#wx-create-dialog .target-card:hover { background: rgba(255, 255, 255, 0.055) !important; }\n#wx-create-dialog .target-card.sel { background: rgba(240, 179, 85, 0.07) !important; border-top-color: var(--heat) !important; }\n.target-head { display: flex; justify-content: space-between; align-items: center; gap: 6px; }\n#wx-create-dialog .target-name { font-size: 14px; font-weight: 600; color: var(--t-hi); }\n#wx-create-dialog .target-stars { font-size: 11px; color: var(--heat); letter-spacing: 1px; }\n#wx-create-dialog .target-detail-stars { font-size: 12px; color: var(--heat); letter-spacing: 1px; }\n#wx-create-dialog .target-meta-row { display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: var(--t-mid); gap: 6px; }\n#wx-create-dialog .target-type-badge { display: inline-block; padding: 0 0 0 6px; border: 0 !important; border-left: 2px solid var(--t-low) !important; border-radius: 0 !important; font: 600 9.5px/1.4 ui-monospace, Consolas, monospace; letter-spacing: .08em; background: none !important; color: var(--t-mid) !important; }\n#wx-create-dialog .target-area { font-size: 11px; color: var(--t-mid); }\n#wx-create-dialog .target-tagline { font-size: 11px; color: var(--t-mid); font-style: italic; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }\n#wx-create-dialog .target-features { font-size: 10px; color: var(--t-mid); line-height: 1.4; }\n\n#wx-create-dialog .target-detail-box { margin-top: 10px; background: rgba(255, 255, 255, 0.024) !important; border: 0 !important; border-top: 1px solid rgba(255, 255, 255, 0.07) !important; border-radius: 4px !important; padding: 10px 12px; display: flex; flex-direction: column; gap: 5px; }\n#wx-create-dialog .target-detail-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important; padding-bottom: 5px; }\n.target-detail-title-wrap { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }\n.target-detail-action-wrap { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }\n#wx-create-dialog .target-detail-name { font-size: 15px; font-weight: 600; color: var(--t-hi) !important; }\n#wx-create-dialog .target-detail-badge { padding: 1px 7px; border: 0 !important; border-left: 2px solid var(--her) !important; border-radius: 2px !important; font-size: 11px; font-weight: 600; background: rgba(217, 143, 160, 0.10) !important; color: #eec3cb !important; }\n#wx-create-dialog .target-status-badge { font-size: 10px; padding: 1px 6px; border-radius: 4px; }\n#wx-create-dialog .target-status-badge.ready { background: rgba(95, 214, 195, 0.10) !important; border: 0 !important; border-left: 2px solid var(--safe) !important; border-radius: 2px !important; color: var(--safe) !important; }\n#wx-create-dialog .btn-reroll-target { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px !important; font-size: 12px !important; font-weight: 600; letter-spacing: .04em; border-radius: 2px !important; background: rgba(240, 179, 85, 0.12) !important; border: 1px solid rgba(240, 179, 85, 0.55) !important; color: var(--heat) !important; cursor: pointer; transition: all .15s; }\n#wx-create-dialog .btn-reroll-target .btn-ico svg { width: 14px; height: 14px; }\n#wx-create-dialog .btn-reroll-target:hover { background: rgba(240, 179, 85, 0.22) !important; border-color: var(--heat) !important; color: #ffe2b0 !important; }\n#wx-create-dialog .target-gen-name { font-weight: 600; color: var(--t-hi); font-size: 13px; letter-spacing: 0; }\n#wx-create-dialog .target-gen-sub { font-size: 10px; color: var(--t-low); margin-left: 6px; }\n#wx-create-dialog .target-stat-delta-pos { color: var(--safe); font-weight: 600; margin-left: 2px; }\n#wx-create-dialog .target-stat-delta-neg { color: #ff9aa3; font-weight: 600; margin-left: 2px; }\n.target-detail-area { font-size: 11px; color: #8da4b8; }\n.target-detail-tagline { font-size: 11px; color: #afc3d2; font-style: italic; margin: 0; }\n.target-detail-rows { display: flex; flex-direction: column; gap: 3px; font-size: 11px; }\n#wx-create-dialog .target-row { color: var(--t-low); }\n#wx-create-dialog .target-row b { color: var(--t-mid); margin-right: 6px; }\n\n/* 底部操作条 */\n#wx-create-dialog .create-foot { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 12px; margin-top: 14px; gap: 12px; flex-wrap: wrap; }\n#wx-create-dialog .create-hint { font-size: 12px; color: var(--t-low); }\n#wx-create-dialog .zero-btn-prev { background: none !important; border: 1px solid rgba(255, 255, 255, 0.14) !important; color: var(--t-mid) !important; border-radius: 2px !important; cursor: pointer; transition: all .15s; }\n#wx-create-dialog .zero-btn-prev:hover { background: rgba(255, 255, 255, 0.05) !important; color: var(--t-hi) !important; }\n#wx-create-dialog .zero-btn-next, #wx-create-dialog .create-confirm:not(:disabled) { background: rgba(240, 179, 85, 0.12) !important; border: 1px solid rgba(240, 179, 85, 0.45) !important; border-radius: 2px !important; color: var(--heat) !important; cursor: pointer; transition: all .15s; }\n#wx-create-dialog .zero-btn-next:hover, #wx-create-dialog .create-confirm:not(:disabled):hover { background: rgba(240, 179, 85, 0.2) !important; color: #ffe2b0 !important; }\n#wx-create-dialog .zero-btn-next:disabled, #wx-create-dialog .create-confirm:disabled { opacity: .35 !important; cursor: not-allowed; }\n/* 常驻条身份徽记（青色，与优势金色区分；v0.8） */\n.trpg .slim-tag.id-badge { cursor: pointer; color: #a8e6d5; border-color: #3f6c62; }\n.trpg .slim-tag.id-badge:hover { border-color: #7fd4c1; }\n/* 未开局覆盖钮（新局且未确认身份时盖住常驻条） */\n.trpg-slim-bar { position: relative; }\n#zeroChip { position: absolute; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(13, 19, 26, .94); border: 1px dashed #4a5d70; border-radius: 7px; color: #7fd4c1; font-size: 13px; cursor: pointer; }\n#zeroChip[hidden] { display: none; }\n/* ═══ M4-2 三翼战术 Canvas 判定台样式（夜巡语言：去边框、顶部留一条极细线、光与材质当结构） ═══\n   判定台是单例弹窗，规则统一带 #wx-settle-dialog 作用域：\n   一是压得住宿主通用按钮皮（dialog.wx-dialog button 带 !important），二是避免与终端的同名类互相牵连。 */\ndialog#wx-settle-dialog {\n  width: min(860px, calc(100vw - 16px)) !important;\n  max-height: 92vh !important;\n  background: #070b10 !important;\n  border: 0 !important;\n  border-top: 1px solid rgba(240, 179, 85, 0.22) !important;\n  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.92) !important;\n  padding: 14px 16px !important;\n}\n.settle-body {\n  font-size: 13px;\n  line-height: 1.6;\n  padding: 4px 0 8px;\n}\n#wx-settle-dialog .stage-console {\n  display: grid;\n  grid-template-columns: 210px 1fr 240px;\n  gap: 12px;\n  background: none !important;\n  border: 0 !important;\n  box-shadow: none !important;\n  border-radius: 10px;\n  padding: 2px 0 !important;\n  position: relative;\n  overflow: hidden;\n}\n@media (max-width: 760px) {\n  .stage-console { grid-template-columns: 1fr; }\n}\n#wx-settle-dialog .wing {\n  background: rgba(255, 255, 255, 0.028) !important;\n  border: 0 !important;\n  border-top: 1px solid rgba(255, 255, 255, 0.07) !important;\n  border-radius: 4px !important;\n  padding: 10px;\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  position: relative;\n  z-index: 10;\n}\n.wing-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  border-bottom: 1px solid rgba(75, 125, 185, 0.18);\n  padding-bottom: 5px;\n  font-size: 11px;\n}\n#wx-settle-dialog .wing-tag {\n  font: 600 9.5px/1.5 ui-monospace, Consolas, monospace !important;\n  color: var(--t-low) !important;\n  border: 0 !important;\n  padding: 1px 5px;\n  border-radius: 3px;\n  letter-spacing: .16em;\n}\n#wx-settle-dialog .wing-title { color: var(--t-mid) !important; letter-spacing: 0.04em; font-weight: 600 !important; }\n\n#wx-settle-dialog .action-badge {\n  font: 600 11.5px/1.5 ui-monospace, Consolas, monospace !important;\n  color: #f4d6a0 !important;\n  background: rgba(240, 179, 85, 0.08) !important;\n  border: 0 !important;\n  border-left: 2px solid var(--heat) !important;\n  border-radius: 0 !important;\n  padding: 4px 8px;\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n.mods-stack {\n  display: flex;\n  flex-direction: column;\n  gap: 5px;\n  min-height: 100px;\n}\n#wx-settle-dialog .chip-item {\n  font: 11.5px Consolas, monospace;\n  padding: 3px 8px;\n  border-radius: 0 !important;\n  background: rgba(255, 255, 255, 0.04) !important;\n  border: 0 !important;\n  border-left: 2px solid rgba(255, 255, 255, 0.14) !important;\n  color: var(--t-mid) !important;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  opacity: 0;\n  transform: translateX(-8px);\n  animation: chipSlideIn .25s cubic-bezier(.16, 1.3, .3, 1) forwards;\n}\n@keyframes chipSlideIn { to { opacity: 1; transform: translateX(0); } }\n#wx-settle-dialog .chip-item.hidden-mod {\n  border-left-color: var(--danger) !important;\n  color: #ffa9b1 !important;\n  background: rgba(255, 90, 104, 0.07) !important;\n}\n#wx-settle-dialog .chip-item.ripple-mod {\n  border-left-color: var(--heat) !important;\n  color: #f0d9a8 !important;\n  background: rgba(240, 179, 85, 0.06) !important;\n}\n#wx-settle-dialog .chip-item b { color: var(--t-hi) !important; font-weight: normal; }\n\n#wx-settle-dialog .ekg-widget {\n  margin-top: auto;\n  background: rgba(255, 255, 255, 0.03) !important;\n  border: 0 !important;\n  border-top: 1px solid rgba(255, 255, 255, 0.06) !important;\n  border-radius: 0 !important;\n  padding: 6px 8px;\n}\n#wx-settle-dialog .ekg-top {\n  display: flex;\n  justify-content: space-between;\n  font: 10px Consolas, monospace;\n  color: var(--t-low) !important;\n  margin-bottom: 2px;\n}\n#wx-settle-dialog .ekg-top .bpm { color: var(--safe) !important; font-weight: 600 !important; }\n.ekg-svg { width: 100%; height: 22px; display: block; }\n#wx-settle-dialog .ekg-trace {\n  fill: none;\n  stroke: rgba(95, 214, 195, 0.8) !important;\n  stroke-width: 1.6;\n  stroke-dasharray: 200;\n  stroke-dashoffset: 200;\n  animation: ekgLoop 1.8s linear infinite;\n}\n@keyframes ekgLoop { to { stroke-dashoffset: -200; } }\n\n#wx-settle-dialog .stage-center {\n  position: relative;\n  min-height: 350px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  overflow: hidden;\n  background: none !important;\n}\n.stage-center .corner {\n  position: absolute; width: 12px; height: 12px; border: 2px solid rgba(79, 143, 214, 0.45); pointer-events: none; transition: border-color .3s;\n}\n#wx-settle-dialog .stage-center .corner { border-color: rgba(255, 255, 255, 0.18) !important; }\n.stage-center .c-tl { top: 6px; left: 6px; border-right: none; border-bottom: none; }\n.stage-center .c-tr { top: 6px; right: 6px; border-left: none; border-bottom: none; }\n.stage-center .c-bl { bottom: 6px; left: 6px; border-right: none; border-top: none; }\n.stage-center .c-br { bottom: 6px; right: 6px; border-left: none; border-top: none; }\n\n#wx-settle-dialog .hud-status {\n  position: absolute; top: 8px; left: 50%; transform: translateX(-50%);\n  font: 10px Consolas, monospace; letter-spacing: 0.2em; color: var(--t-low) !important;\n  transition: color .3s; white-space: nowrap; z-index: 8;\n}\n\n#wx-settle-dialog .radar-ring {\n  position: absolute; width: 260px; height: 260px; border-radius: 50%;\n  border: 1px dashed rgba(255, 255, 255, 0.10) !important; pointer-events: none;\n  animation: rSpin 18s linear infinite;\n}\n@keyframes rSpin { to { transform: rotate(360deg); } }\n\n.die-stage-center {\n  position: relative;\n  width: 250px;\n  height: 250px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\ncanvas#settleDieCanvas {\n  display: block;\n  width: 250px;\n  height: 250px;\n  z-index: 5;\n  cursor: grab;\n}\ncanvas#settleDieCanvas:active { cursor: grabbing; }\n\n#wx-settle-dialog .die-shadow {\n  position: absolute;\n  width: 160px;\n  height: 18px;\n  bottom: -6px;\n  left: 45px;\n  border-radius: 50%;\n  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 70%) !important;\n  pointer-events: none;\n  z-index: 2;\n  transition: transform .15s ease;\n}\n\n#wx-settle-dialog .verdict-box {\n  text-align: center;\n  padding: 5px;\n  background: rgba(255, 255, 255, 0.03) !important;\n  border-radius: 4px !important;\n  border: 0 !important;\n  min-height: 56px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n}\n#wx-settle-dialog .verdict-badge {\n  font: 700 20px Consolas, monospace;\n  letter-spacing: 0.2em;\n  opacity: 0;\n  transform: scale(0.85);\n  transition: all .28s cubic-bezier(.2, 1.4, .4, 1);\n}\n#wx-settle-dialog .verdict-badge.show { opacity: 1; transform: scale(1); }\n#wx-settle-dialog .verdict-badge.crit { color: var(--heat) !important; text-shadow: 0 0 18px rgba(240, 179, 85, 0.55) !important; }\n#wx-settle-dialog .verdict-badge.fail { color: #ff9aa3 !important; text-shadow: 0 0 16px rgba(255, 90, 104, 0.45) !important; }\n#wx-settle-dialog .verdict-badge.success { color: var(--safe) !important; text-shadow: 0 0 16px rgba(95, 214, 195, 0.45) !important; }\n#wx-settle-dialog .verdict-badge.grace { color: #e9d3ad !important; text-shadow: none !important; }\n\n#wx-settle-dialog .math-line {\n  font: 11px Consolas, monospace;\n  color: var(--t-low) !important;\n  margin-top: 2px;\n}\n#wx-settle-dialog .math-line b { color: var(--t-hi) !important; font-weight: normal; }\n\n.ledger-wrap {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  min-height: 90px;\n}\n#wx-settle-dialog .ledger-row {\n  font: 11px Consolas, monospace;\n  padding: 2.5px 7px;\n  border-radius: 0 !important;\n  background: none !important;\n  border-left: 2px solid rgba(255, 255, 255, 0.16) !important;\n  color: var(--t-mid) !important;\n  display: flex;\n  justify-content: space-between;\n  opacity: 0;\n  transform: translateY(4px);\n  transition: all .25s ease;\n}\n#wx-settle-dialog .ledger-row.show { opacity: 1; transform: translateY(0); }\n#wx-settle-dialog .ledger-row.warn { border-left-color: var(--danger) !important; color: #ff9aa3 !important; }\n#wx-settle-dialog .ledger-row.gain { border-left-color: var(--safe) !important; color: var(--safe) !important; }\n.ledger-row .val { font-weight: bold; }\n\n#wx-settle-dialog .dark-reveal-card {\n  font-size: 10.5px;\n  line-height: 1.45;\n  color: #ffa9b1 !important;\n  background: rgba(255, 90, 104, 0.06) !important;\n  border: 0 !important;\n  border-left: 2px solid var(--danger) !important;\n  border-radius: 0 !important;\n  padding: 5px 7px;\n  opacity: 0;\n  transform: scale(0.95);\n  transition: all .3s ease;\n  margin-top: auto;\n}\n#wx-settle-dialog .dark-reveal-card.show { opacity: 1; transform: scale(1); }\n#wx-settle-dialog .dark-reveal-card b { color: #ffc2c8 !important; }\n\n#wx-settle-dialog .queue-history {\n  display: flex;\n  flex-direction: column;\n  gap: 3px;\n  margin-top: 4px;\n  border-top: 1px dashed rgba(255, 255, 255, 0.08) !important;\n  padding-top: 4px;\n}\n#wx-settle-dialog .history-item {\n  font: 10px Consolas, monospace;\n  padding: 2px 5px;\n  border-radius: 0 !important;\n  background: rgba(255, 255, 255, 0.03) !important;\n  border: 0 !important;\n  border-left: 2px solid rgba(255, 255, 255, 0.12) !important;\n  color: var(--t-low) !important;\n  display: flex;\n  justify-content: space-between;\n}\n#wx-settle-dialog .history-item b { color: var(--t-hi) !important; font-weight: normal; }\n\n.flash-overlay {\n  position: absolute; inset: 0; pointer-events: none; opacity: 0; z-index: 7;\n}\n.flash-overlay.ok { background: radial-gradient(circle at 50% 50%, rgba(142,226,179,.22) 0%, transparent 68%); animation: fl .7s ease-out; }\n.flash-overlay.bad { background: radial-gradient(circle at 50% 50%, rgba(224,86,106,.24) 0%, transparent 68%); animation: fl .7s ease-out; }\n.flash-overlay.crit { background: radial-gradient(circle at 50% 50%, rgba(216,183,104,.32) 0%, transparent 68%); animation: fl .85s ease-out; }\n@keyframes fl { 0% { opacity: 0; } 20% { opacity: 1; } 100% { opacity: 0; } }\n\n/* 底栏沿用 .dialog-actions 的排布（勾选与确认同侧），这里只补夜巡的语言化内边距 */\n.settle-actions { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 10px; }\n#wx-settle-dialog .settle-actions { padding-top: 12px !important; border-top: 1px solid rgba(255, 255, 255, 0.06) !important; }\n#wx-settle-dialog .settle-auto { font-size: 12px; color: var(--t-mid) !important; display: flex; align-items: center; gap: 6px; cursor: pointer; }\n#wx-settle-dialog .settle-ack { min-width: 88px !important; font-weight: 700; }\n#wx-settle-dialog .settle-ack:not(:disabled) {\n  background: rgba(95, 214, 195, 0.12) !important;\n  border: 1px solid rgba(95, 214, 195, 0.45) !important;\n  border-radius: 2px !important;\n  color: var(--safe) !important;\n}\n#wx-settle-dialog .settle-ack:not(:disabled):hover { background: rgba(95, 214, 195, 0.2) !important; color: #d8fff6 !important; }\n/* 旧 520px 块里 .bar/.columns/.column/.drawer/.value/.phase 已随 GLM 骨架废弃，只留仍在用的三类 */\n@media (max-width: 520px) {\n  .trpg .stat { padding: 10px 7px; }\n  .trpg .label { font-size: 10px; }\n  .trpg .stat.instrument { padding: 8px 8px 10px; }\n  .trpg .heart-dial { width: min(100%, 124px); }\n}\n\n/* ═══ 桌面窄窗（≤800px）先让一层 ═══\n   C 案字号抬高后（场所 15px / 心跳 24px），整套左簇需要的宽度比原来更大；\n   窗口窄于 ≈860 时就会把标签齐根裁掉。先收三样最低价值的读数：\n   收摊步数、BPM、设备入口（后两者终端里都有），并把路牌与刻度收一档。 */\n@media (max-width: 860px) {\n  .slim-tag.remain { display: none; }\n  .mini-heart-bpm { display: none; }\n  /* .trpg .slim-btn 把 display 写回了 inline-flex，这里要同前缀压回来 */\n  .trpg .slim-btn.phone-stat { display: none !important; }\n  /* 场所名走省略号，别齐根裁掉半截标签 */\n  .slim-left { min-width: 0; gap: 7px; }\n  .slim-place { min-width: 0; overflow: hidden; text-overflow: ellipsis; font-size: 13px; }\n  .slim-tags-group { gap: 7px; }\n  .slim-tag { font-size: 10.5px; padding-left: 6px; }\n  .slim-center { gap: 6px; }\n  .mini-heart-num { font-size: 21px; }\n  .mini-heart { font-size: 17px; }\n}\n\n/* ≤660px：再收一层——大区徽记（场所名已足够定位）与 4 个距离点（档位文字仍在）。\n   561~660 区间实测左簇仍会被裁掉 5~64px。 */\n@media (max-width: 660px) {\n  .slim-dist-badge { display: none; }\n  .slim-pips { display: none; }\n  .slim-divider { display: none; }\n}\n\n/* ═══ 手机断点（≤560px）常驻条与终端重排 ═══\n   旧 520px 块只管 .bar/.columns/.column/.drawer 等已废弃的 GLM 骨架类；\n   新结构（trpg-slim-bar / wx-capsule-bar / wx-terminal-*）此前没有任何响应式规则，\n   390px 下左簇被 min-width:0 压成 0 宽、终端按钮被裁半个字。 */\n@media (max-width: 560px) {\n  /* 常驻条：保留位置、距离档、终局红线、心跳、终端；次级信息让位 */\n  /* 预览壳在窄屏上收内边距（box-sizing / min-width 已在基础规则里处理） */\n  main.wx-standalone-main { padding: 10px 8px; }\n  .trpg-slim-bar { padding: 0 6px; gap: 5px; }\n  .slim-left { gap: 5px; }\n  .slim-place { font-size: 12.5px; min-width: 0; overflow: hidden; text-overflow: ellipsis; }\n  .slim-tags-group { gap: 6px; }\n  /* 天气：终端沙盘与动线雨幕特效里都还在，条上不重复占位 */\n  .slim-tag.weather { display: none; }\n  /* 收摊步数：次级信息，保留在终端与 tooltip */\n  .slim-tag.remain { display: none; }\n  /* C 案的标签是\"左竖条 + 文字\"，窄屏只收字号，不能补 padding 把竖条挤没 */\n  .slim-tag.strike-tag.allowed, .slim-tag.strike-tag.sealed { font-size: 10px; padding: 0 0 0 5px; }\n  .slim-tag.id-badge { font-size: 10px; padding: 0 0 0 5px; }\n  /* 距离档与读数之间拉一根发丝线，别读成一句话 */\n  .slim-center { gap: 4px; padding: 0 8px 0 0; border-right: 1px solid rgba(255, 255, 255, 0.07); }\n  .slim-pips { display: none; }\n  .slim-divider { display: none; }\n  .slim-right { gap: 8px; }\n  .slim-stamina { padding: 0; }\n  /* 40px 细线在窄条上没有信息量，数字承担 */\n  .slim-stamina-bar { display: none; }\n  .mini-heart-bpm { display: none; }\n  .mini-heart { font-size: 17px; }\n  .mini-heart-num { font-size: 22px; }\n  .trpg .heart-pill-btn { padding: 0 !important; }\n  .trpg .slim-btn { padding: 2px 2px !important; }\n  /* 设备入口在终端深页里已有（监控设备 ↗），条上让位给终端图标 */\n  .phone-stat { display: none; }\n  .term-txt { display: none; }\n\n  /* 胶囊条：压缩内边距，靠横向滑动承载全部胶囊（C3：只收尺寸，不动皮肤） */\n  .wx-capsule-bar { padding: 3px 6px; gap: 5px; }\n  .wx-posture-badge { font-size: 9px; gap: 3px; }\n  .trpg .wx-capsule-chip { font-size: 10.5px; padding: 3px 8px; min-height: 26px !important; }\n  .trpg .wx-more-btn { font-size: 10.5px; padding: 3px 4px; }\n  /* 右边缘渐隐，提示这一排可以横滑（否则被裁的胶囊看起来像渲染错） */\n  .wx-chips-wrap {\n    -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 16px), transparent);\n    mask-image: linear-gradient(90deg, #000 calc(100% - 16px), transparent);\n  }\n\n  /* 心跳弹层：贴边不越界，刻度文字不再随 SVG 缩到 6px */\n  .heart-popover-card { width: min(300px, calc(100vw - 16px)); right: -4px; padding: 9px 10px; }\n  .popover-content .heart-dial { width: 138px; }\n  .popover-content .stamina, .popover-content .spark { width: 138px; }\n\n  /* 终端：标题不再折三行，徽记让位；动线轨可横滑而不是被切 */\n  .wx-modal-head { padding: 10px 12px; gap: 8px; }\n  .wx-modal-title { font-size: 12.5px; letter-spacing: 0; }\n  /* 阶段徽记（第 N 晚 · 潜行阶段）是模式唯一读数，不隐藏，只收紧 */\n  .wx-modal-badge { font-size: 9.5px; padding: 1px 5px; line-height: 1.25; max-width: none; white-space: nowrap; }\n  .wx-terminal-icon { display: none; }\n  .wx-modal-close { padding: 4px 6px !important; font-size: 15px; }\n  .wx-modal-body { padding: 12px 12px 10px; }\n  .wx-modal-body .route-tracker { padding: 10px 12px 12px; }\n  .route-stepper { overflow-x: auto; scrollbar-width: none; }\n  .route-stepper::-webkit-scrollbar { display: none; }\n  .wx-terminal-envbox, .wx-wing-card { padding: 10px 12px; }\n  .trpg .wx-terminal-ledger[data-tip] { margin: 0 12px 10px; }\n\n  /* 判定台单翼叠放后，三翼间距收一档 */\n  .stage-console { padding: 10px; gap: 10px; }\n}\n\n/* ≤430px：再让一档——大区徽记退场（场所名已足够定位，大区在终端沙盘里），\n   把宽度还给场所名，避免窄条上只剩一个「居」字。 */\n@media (max-width: 430px) {\n  .slim-dist-badge { display: none; }\n  .slim-tag.strike-tag.allowed, .slim-tag.strike-tag.sealed { font-size: 9.5px; padding: 0 0 0 4px; }\n  /* 模式（潜行）在终端阶段徽记里仍有读数；窄条上把宽度让给场所与红线 */\n  .slim-phase { display: none; }\n  .slim-place { font-size: 12px; }\n}\n\n/* ≤380px（小屏安卓 / SE）：只剩 2px 的富余，把间隙与心跳内边距再收一点，\n   让场所名不被省略号截掉。 */\n@media (max-width: 380px) {\n  .trpg-slim-bar { gap: 4px; padding: 0 5px; }\n  .slim-right { gap: 3px; }\n  .heart-pill-btn { padding: 2px 5px; }\n  .mini-heart { margin-right: 3px; }\n}\n/* ═══ 相册（贴墙）与拍照即时卡片 ═══ */\n.wx-album-dialog { width: min(92vw, 560px); max-height: 80vh; }\n.album-count { font: 600 11px/1 ui-monospace, Consolas, monospace; color: var(--t-low); margin-left: 6px; }\n.album-wall { overflow-y: auto; padding: 8px 4px 12px; display: flex; flex-direction: column; gap: 10px; }\n.wall-sec { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start; padding-top: 14px; position: relative; }\n.wall-sec::before {\n  content: attr(data-cn); position: absolute; top: 0; left: 0;\n  font: 600 10px/1 ui-monospace, Consolas, monospace; letter-spacing: .14em; color: var(--t-low);\n}\n.photo {\n  width: 76px; height: 104px; background: #e8e6e1; padding: 4px 4px 14px; border-radius: 2px;\n  box-shadow: 0 4px 10px rgba(0,0,0,.45); transform: rotate(var(--tilt, -1.5deg));\n  cursor: pointer; position: relative; box-sizing: border-box;\n}\n.photo:nth-child(3n) { --tilt: 1.6deg; }\n.photo:nth-child(4n) { --tilt: -2.2deg; }\n.photo img { width: 100%; height: 86px; object-fit: cover; display: block; background: #2a2f35; }\n.photo .cap { position: absolute; left: 5px; right: 5px; bottom: 3px; font: 500 8px/1.2 ui-monospace, Consolas, monospace; color: #4a4a46; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }\n.photo.empty { height: 96px; background: transparent; box-shadow: none; border: 1px dashed rgba(255,255,255,.18); border-radius: 2px; cursor: default; }\n.photo.empty::after { content: \"\"; }\n.photo.broken { background: #2b2a27; }\n.photo.broken img { display: none; }\n.photo.broken .cap { color: #8c8a80; }\n.album-detail { position: fixed; inset: 0; background: rgba(4,7,10,.92); z-index: 20050; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 20px; }\n.album-detail[hidden] { display: none; }\n.album-detail img { max-width: min(92vw, 520px); max-height: 68vh; object-fit: contain; box-shadow: 0 10px 40px rgba(0,0,0,.6); }\n.album-detail-meta { font: 500 12px/1.6 ui-monospace, Consolas, monospace; color: var(--t-mid); text-align: center; }\n.photo-toast {\n  position: fixed; right: 16px; bottom: 118px; z-index: 20040;\n  display: flex; gap: 8px; align-items: center; padding: 8px;\n  background: rgba(16,23,31,.96); border: 1px solid var(--line); border-radius: 6px;\n  box-shadow: 0 8px 24px rgba(0,0,0,.5); animation: toastIn .22s ease-out;\n}\n.photo-toast[hidden] { display: none; }\n.photo-toast img { width: 44px; height: 58px; object-fit: cover; border-radius: 2px; background: #2a2f35; }\n.photo-toast-txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.photo-toast-txt b { font: 600 12px/1.2 \"Noto Sans SC\", system-ui, sans-serif; color: var(--t-hi); }\n.photo-toast-txt span { font: 500 10px/1.2 ui-monospace, Consolas, monospace; color: var(--t-low); }\n@keyframes toastIn { from { transform: translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }";

    // 2. 支持热更新替换（若已有旧状态栏则安全清理，无需刷新酒馆整页即可立即生效）
    var oldRoot = topDoc.getElementById("wx-statusbar-root");
    if (oldRoot && oldRoot.parentNode) oldRoot.parentNode.removeChild(oldRoot);
    var oldModals = topDoc.getElementById("wx-modals-root");
    if (oldModals && oldModals.parentNode) oldModals.parentNode.removeChild(oldModals);

    // 3. 创建主状态栏 DOM 并嵌入输入栏
    var root = topDoc.createElement("div");
    root.id = "wx-statusbar-root";
    root.className = "trpg";
    root.innerHTML = "<div class=\"trpg-vignette\" id=\"trpgVignette\" aria-hidden=\"true\"></div>\n    <div class=\"her-alert\" id=\"herAlert\" data-tip=\"她刚才的举动。是发现了什么，还是单纯的心血来潮——只有她自己知道。\"></div>\n\n    <!-- ═══ 常驻一小窄行（紧贴输入栏，高度38px，不挡正文） ═══ -->\n    <div class=\"trpg-slim-bar\" id=\"trpgSlimBar\">\n      <!-- 零楼 · 未开局覆盖钮（新局未确认身份时盖住常驻条） -->\n      <div id=\"zeroChip\" hidden role=\"button\" tabindex=\"0\">未开局 · 点击选择身份</div>\n      <!-- 左：大区与场所、天气、终局红线、收摊步数 -->\n      <div class=\"slim-left\" data-tip=\"当前动线与场所状态\">\n        <span class=\"slim-dist-badge\" id=\"routeDistrict\">老城</span>\n        <span class=\"slim-place\" id=\"routePlace\">杂物暗巷</span>\n        <div class=\"slim-tags-group\">\n          <span class=\"slim-tag weather\" id=\"routeWeather\">小雨</span>\n          <span class=\"slim-tag strike-tag allowed\" id=\"routeStrikeTag\">终局开</span>\n          <span class=\"slim-tag remain\" id=\"routeRemain\">离收摊剩 1 步</span>\n          <span class=\"slim-tag id-badge\" id=\"idBadge\" hidden data-tip=\"你的开局身份（零楼选定，点开看详情）\">身份</span>\n        </div>\n      </div>\n\n      <!-- 中：模式与距离档 -->\n      <div class=\"slim-center\" id=\"distStat\" data-tip=\"当前模式与尾行距离档\">\n        <span class=\"slim-phase\" id=\"phase\">潜行</span>\n        <span class=\"slim-divider\">/</span>\n        <span class=\"slim-dist\" id=\"distName\">同街</span>\n        <span class=\"slim-pips\" id=\"pips\" aria-hidden=\"true\"><i class=\"pip\"></i><i class=\"pip active\"></i><i class=\"pip\"></i><i class=\"pip\"></i></span>\n      </div>\n\n      <!-- 右：体力、跳动小红心心跳子菜单、设备、展开详情 -->\n      <div class=\"slim-right\">\n        <!-- 迷你体力 -->\n        <div class=\"slim-stamina\" id=\"staminaBox\" data-band=\"green\" data-tip=\"当前体力\">\n          <span class=\"slim-stamina-val\" id=\"staminaVal\">72%</span>\n          <span class=\"slim-stamina-bar\"><span class=\"stamina-fill\" id=\"staminaFill\" style=\"width: 72%;\"></span></span>\n        </div>\n\n        <!-- 心跳子菜单（收起时显示为随心跳频率跳动的小红心，点击向上弹出完整仪表盘） -->\n        <div class=\"heart-popover-wrap\" id=\"heartPopoverWrap\">\n          <button type=\"button\" class=\"heart-pill-btn\" id=\"heartPillBtn\" aria-expanded=\"false\" aria-haspopup=\"dialog\" data-tip=\"点击向上弹出心跳仪表盘\">\n            <span class=\"mini-heart\" id=\"miniHeart\" aria-hidden=\"true\">♥</span>\n            <span class=\"mini-heart-num\" id=\"miniHeartNum\">58</span>\n            <span class=\"mini-heart-bpm\" id=\"miniBpmNum\">72 BPM</span>\n          </button>\n\n          <!-- 向上弹出子菜单卡片 -->\n          <div class=\"heart-popover-card\" id=\"heartPopoverCard\" role=\"dialog\" aria-label=\"心跳仪表盘\">\n            <div class=\"popover-head\">\n              <span class=\"popover-title\">生理心率与压力监控</span>\n              <button type=\"button\" class=\"popover-close-btn\" id=\"heartPopoverClose\" aria-label=\"关闭\">✕</button>\n            </div>\n            <div class=\"popover-content\">\n              <div class=\"popover-grid\">\n                <div class=\"stat instrument\" id=\"instrument\" data-line=\"\" data-tip=\"心跳 0–100。绿弧为甜区 40–65：全检定 +1。70 起操作变形（敏捷 −2），90 起操作崩溃（敏捷 −4）。BPM 为换算读数。\">\n                <svg class=\"heart-dial\" viewBox=\"0 0 160 154\" role=\"img\" aria-label=\"心跳\" id=\"dial\">\n                  <defs><clipPath class=\"ecg-clip\" id=\"ecgClip\"><circle cx=\"80\" cy=\"80\" r=\"48\"></circle></clipPath></defs>\n                  <path class=\"dial-track\"></path><path class=\"dial-sweet\"></path><g class=\"dial-ticks\"></g>\n                  <circle class=\"dial-beat-halo\" cx=\"80\" cy=\"80\" r=\"52\" aria-hidden=\"true\"></circle>\n                  <g class=\"ecg-window\" aria-hidden=\"true\"><g class=\"ecg-scroll\"><path class=\"ecg-line\"></path></g></g>\n                  <g class=\"dial-marker-orbit\" id=\"orbit\" style=\"transform: rotate(135deg)\"><circle class=\"dial-marker\" cx=\"142\" cy=\"80\" r=\"4.5\"></circle></g>\n                  <text x=\"80\" y=\"48\" text-anchor=\"middle\" class=\"dial-label\">心跳</text>\n                  <text x=\"80\" y=\"87\" text-anchor=\"middle\" class=\"dial-number\" id=\"heartNum\">58</text>\n                  <text x=\"80\" y=\"100\" text-anchor=\"middle\" class=\"dial-bpm\" id=\"bpmNum\">72 BPM</text>\n                  <text x=\"62\" y=\"49\" text-anchor=\"middle\" class=\"dial-heart\" aria-hidden=\"true\">♥</text>\n                  <text x=\"27\" y=\"139\" text-anchor=\"middle\" class=\"dial-scale\">0</text>\n                  <text x=\"133\" y=\"139\" text-anchor=\"middle\" class=\"dial-scale\">100</text>\n                </svg>\n                <!-- 刻度说明已移除：阈值并入 #instrument 的悬停提示，版面让给右侧警觉竖条 -->\n                <div class=\"stamina\" id=\"fullStaminaBox\" data-band=\"green\" data-tip=\"体力状态\">\n                  <div class=\"stamina-label\"><span>体力 <span class=\"band-name\" id=\"bandName\"></span></span><span class=\"stamina-value\" id=\"fullStaminaVal\">72%</span></div>\n                  <div class=\"stamina-meter\" role=\"progressbar\" aria-label=\"体力\" aria-valuemin=\"0\" aria-valuemax=\"100\" aria-valuenow=\"72\"><span class=\"stamina-fill\" id=\"fullStaminaFill\"></span></div>\n                </div>\n                <svg class=\"spark\" viewBox=\"0 0 120 20\" preserveAspectRatio=\"none\" aria-hidden=\"true\" data-tip=\"近 12 段的心跳走势复盘；虚线为甜区中线。\">\n                  <line x1=\"0\" y1=\"9\" x2=\"120\" y2=\"9\"></line>\n                  <polyline id=\"sparkLine\" points=\"\"></polyline>\n                </svg>\n                </div>\n                <!-- 右侧窄栏：她的警觉（只给档位与五格刻度，不报精确数值） -->\n                <aside class=\"popover-her\" id=\"popoverHerState\" data-tier=\"0\" data-tip=\"她此刻对你的警觉档位。数值不直接显示——她的脸就是仪表。\">\n                  <span class=\"popover-her-title\">她的警觉</span>\n                  <span class=\"alert-pips\" id=\"popoverAlertPips\" aria-hidden=\"true\"></span>\n                  <span class=\"popover-her-name\" id=\"popoverAlertText\">毫无察觉</span>\n                  <span class=\"popover-her-range\" id=\"popoverAlertRange\">0–20</span>\n                </aside>\n              </div>\n              <div class=\"popover-audio-row\">\n                <button type=\"button\" class=\"audio-btn\" id=\"heartbeat-sound\" aria-pressed=\"false\"><span data-ico=\"music\"></span> 开启雨夜心跳声</button>\n              </div>\n            </div>\n          </div>\n        </div>\n\n        <!-- 手机与设备按钮 -->\n        <button type=\"button\" class=\"slim-btn phone-stat\" data-wx-dialog=\"wx-devices-dialog\" data-tip=\"手机与设备\"><span class=\"phone-icon\" aria-hidden=\"true\" data-ico=\"phone\"></span></button>\n\n        <!-- 战术终端入口按钮 -->\n        <button type=\"button\" class=\"slim-btn terminal-toggle-btn\" id=\"wx-terminal-toggle-btn\" data-tip=\"打开手持战术终端（全量属性/行囊/动线/沙盘）\" aria-expanded=\"false\"><span class=\"term-ico\" aria-hidden=\"true\" data-ico=\"clip\"></span> <span class=\"term-txt\">战术终端</span></button>\n      </div>\n    </div>\n\n    <!-- ═══ 行动胶囊栏（情境自适应 4 胶囊 + 姿态指示 + 二级抽屉展开） ═══ -->\n    <div class=\"wx-capsule-bar\" id=\"wxCapsuleBar\" aria-label=\"战术行动胶囊\">\n      <div class=\"wx-posture-badge\" id=\"wxPostureBadge\" role=\"button\" tabindex=\"0\" data-tip=\"未点选胶囊时，本轮以「跟缀·保持当前距离」继续跟踪。点击切换为纯叙事（不掷骰）。\">默认: 跟缀 · 保持距离</div>\n      <div class=\"wx-chips-wrap\" id=\"wxChipsWrap\"></div>\n      <button type=\"button\" class=\"wx-more-btn\" id=\"wxMoreActionsBtn\" aria-expanded=\"false\" data-tip=\"点开查看当前模式全量战术动作抽屉\">更多 ▾</button>\n\n      <!-- 二级动作抽屉 -->\n      <div class=\"wx-action-drawer\" id=\"wxActionDrawer\" style=\"display: none;\" aria-label=\"全量战术动作抽屉\">\n        <div class=\"drawer-head\">\n          <span class=\"drawer-title\" id=\"wxActionDrawerTitle\">战术动作抽屉</span>\n          <button type=\"button\" class=\"drawer-close\" id=\"wxActionDrawerClose\" aria-label=\"关闭抽屉\">✕</button>\n        </div>\n        <div class=\"drawer-body\" id=\"wxActionDrawerBody\"></div>\n      </div>\n    </div>\n\n    <!-- ═══ 战术终端（HTML5 Top Layer 原生模态对话框，穿透所有层级与容器） ═══ -->\n    <dialog class=\"wx-dialog wx-terminal-dialog trpg\" id=\"wx-terminal-dialog\" aria-labelledby=\"terminalTitle\">\n        <div class=\"wx-modal-head\">\n          <div class=\"wx-modal-title-wrap\">\n            <span class=\"wx-terminal-icon\" data-ico=\"clip\"></span>\n            <h2 class=\"wx-modal-title\" id=\"terminalTitle\">战术终端 · 实时行动手账</h2>\n            <span class=\"wx-modal-badge\" id=\"terminalFloorBadge\">行动阶段</span>\n          </div>\n          <button type=\"button\" class=\"wx-modal-close\" id=\"wx-terminal-close-btn\" data-wx-close aria-label=\"关闭终端\">✕</button>\n        </div>\n\n        <div class=\"wx-modal-body\">\n          <!-- 动线步进雷达轨（展开时呈现完整节点，带充裕边距不截顶） -->\n          <div class=\"route-tracker\" id=\"routeTracker\" data-tip=\"当前动线推进情况与环境红线状态。前方虚线直通终点，收摊倒计时中。\">\n            <div class=\"route-weather-fx\" aria-hidden=\"true\"></div>\n            <div class=\"route-stepper\" id=\"routeStepper\">\n              <div class=\"step-item passed\" data-tip=\"学校正门\"><span class=\"step-dot\"><i class=\"step-ico\" data-ico=\"school\"></i></span><span class=\"step-name\">学校正门</span></div>\n              <div class=\"step-line passed\"></div>\n              <div class=\"step-item unknown\" data-tip=\"？\"><span class=\"step-dot\"><i class=\"step-ico\" data-ico=\"unknown\"></i></span><span class=\"step-name\">？</span></div>\n              <div class=\"step-line passed\"></div>\n              <div class=\"step-item passed\" data-tip=\"24h便利店\"><span class=\"step-dot\"><i class=\"step-ico\" data-ico=\"store\"></i></span><span class=\"step-name\">24h便利店</span></div>\n              <div class=\"step-line passed\"></div>\n              <div class=\"step-item current\" data-tip=\"居民杂物暗巷\"><span class=\"step-dot\"><i class=\"step-ico\" data-ico=\"alley\"></i></span><span class=\"step-name\">居民杂物暗巷</span></div>\n              <div class=\"step-line future\"></div>\n              <div class=\"step-item terminal unknown\" data-tip=\"？\"><span class=\"step-dot\"><i class=\"step-ico\" data-ico=\"unknown\"></i></span><span class=\"step-name\">？</span></div>\n            </div>\n          </div>\n          <!-- 2. 玩家状态核心面板（通栏横向展示：资产 + 五维属性 + 阈值特质） -->\n          <div class=\"wx-player-banner\">\n            <div class=\"wx-banner-header\">\n              <div class=\"wx-banner-title\">\n                <span class=\"section-no\">01</span><strong>玩家资产与五维属性</strong>\n                <small class=\"label\" style=\"font-weight:normal\">（绿色增益 / 红色受损）</small>\n              </div>\n              <div class=\"money wx-compact-money\">\n                <span data-tip=\"现金：购物与买通的硬通货。来源：打工（1 行动点 = 200 元）。\">现金 <strong id=\"cash\">240</strong></span>\n                <span data-tip=\"情报点 PI：解锁常去店 8 / 工作地 10 / 住处 15 / 完整日程 40 / 深层线索 60。收益受情报值系数加成。\">PI <strong id=\"pi\">18</strong></span>\n              </div>\n            </div>\n\n            <!-- 五维属性卡片（5 列等宽，内置静态默认值保底，JS 执行后无缝热更新） -->\n            <div class=\"attrs wx-attrs\" id=\"wx-attrs\">\n              <div class=\"attr eff-down weak\" data-tip=\"体格 基础 3 −1 ＝ 2\"><div class=\"an\">体格</div><div class=\"av\">2</div></div>\n              <div class=\"attr\" data-tip=\"敏捷 4\"><div class=\"an\">敏捷</div><div class=\"av\">4</div></div>\n              <div class=\"attr eff-down weak\" data-tip=\"胆量 基础 4 −1 ＝ 3\"><div class=\"an\">胆量</div><div class=\"av\">3</div></div>\n              <div class=\"attr eff-up hot\" data-tip=\"情报 基础 7 +1 ＝ 8\"><div class=\"an\">情报</div><div class=\"av\">8</div></div>\n              <div class=\"attr eff-up hot\" data-tip=\"口才 基础 7 +1 ＝ 8\"><div class=\"an\">口才</div><div class=\"av\">8</div></div>\n            </div>\n            <div class=\"attr-tags\" id=\"wx-attr-tags\">\n              <span class=\"tag scene\" data-tip=\"瘦小不显眼：更容易藏在人堆里\">不起眼: 遮蔽</span>\n              <span class=\"tag advantage\" data-tip=\"观察粗糙：打量更难看清，运气加成失效\">粗心: 洞察</span>\n            </div>\n          </div>\n\n          <!-- 3. 双翼战术工作区（左翼：行囊与生效修正；右翼：目标行为信号手账） -->\n          <div class=\"wx-tactical-wings\">\n            <!-- 左翼：战术行囊持有物与生效修正标签栈（为后续新系统留出充分扩展空间） -->\n            <div class=\"wx-wing-column\">\n              <div class=\"wx-wing-card\">\n                <h3><span class=\"section-no\">01.3</span>战术行囊持有物</h3>\n                <ul class=\"wx-items items\" id=\"wx-items\">\n                  <li><span>耳机 × 1</span><button type=\"button\" data-wx-item=\"headphones\">查看</button></li>\n                  <li><span>雨伞 × 1</span><button type=\"button\" data-wx-item=\"umbrella\">查看</button></li>\n                  <li><span>护身符 × 1</span><button type=\"button\" data-wx-item=\"amulet\">查看</button></li>\n                </ul>\n\n                <h3 style=\"margin-top:14px\" data-tip=\"当前生效中的加成与妨碍。来源可以是装备、环境或她的行为——来源消失，加成即失效。\">\n                  <span class=\"section-no\">01.4</span>生效修正标签栈\n                </h3>\n                <div class=\"wx-active-tags-container\" id=\"tags\">\n                  <span class=\"tag advantage\" data-tip=\"情报优势：检定额外加成\">优势：情报</span>\n                  <span class=\"tag\" data-tip=\"戴上耳机佯装路人：隐蔽 +1\">耳机伪装</span>\n                  <span class=\"tag scene\" data-tip=\"雨幕遮蔽声响：脚步判定有利\">雨幕</span>\n                  <span class=\"tag scene\" data-tip=\"积水湿滑：敏捷对抗可能打滑\">湿滑</span>\n                  <span class=\"tag target\" data-tip=\"她的步伐加快了\">提速 (2)</span>\n                </div>\n              </div>\n            </div>\n\n            <!-- 右翼：目标行为信号手账（接近度 + 信号时间轴 + 时机评估） -->\n            <div class=\"wx-wing-column\">\n              <div class=\"wx-wing-card\">\n                <h3><span class=\"section-no\">02</span><span data-tip=\"她今晚的行为记录，只写看到的事实。她为什么这么做——需要你自己判断。\">目标行为信号手账</span></h3>\n\n                <!-- 她的鞋具：只露鞋名，敏捷修正与步声细节走悬停 -->\n                <div class=\"gear-line\" id=\"herGear\" hidden>\n                  <span class=\"gear-label\">她的鞋</span>\n                  <span class=\"gear-name\" id=\"herGearName\"></span>\n                </div>\n                \n                <!-- 接近度五档刻度进度轨（全宽舒展，文字横排不折行） -->\n                <div class=\"prox-container\" id=\"proxContainer\">\n                  <div class=\"prox-header\">\n                    <span class=\"prox-title\"><strong>接近度 (PROXIMITY)</strong></span>\n                    <span class=\"prox-value-wrap\">\n                      <strong id=\"proxVal\">36</strong> / 100\n                      <span class=\"prox-stage-badge\" id=\"proxStage\">【眼熟】</span>\n                    </span>\n                  </div>\n                  <div class=\"prox-track-wrap\" id=\"proxTrackWrap\" data-tip=\"接近度加载中...\">\n                    <div class=\"prox-meter-bar\">\n                      <div class=\"prox-meter-fill\" id=\"proxFill\" style=\"width: 36%;\"></div>\n                    </div>\n                    <div class=\"prox-nodes\" id=\"proxNodes\">\n                      <div class=\"pnode passed\" style=\"left: 0%;\"><span class=\"pdot\"></span><span class=\"plabel\">0 陌生</span></div>\n                      <div class=\"pnode active passed\" style=\"left: 20%;\"><span class=\"pdot\"></span><span class=\"plabel\">20 眼熟</span></div>\n                      <div class=\"pnode\" style=\"left: 40%;\"><span class=\"pdot\"></span><span class=\"plabel\">40 交集</span></div>\n                      <div class=\"pnode\" style=\"left: 60%;\"><span class=\"pdot\"></span><span class=\"plabel\">60 搭话</span></div>\n                      <div class=\"pnode\" style=\"left: 80%;\"><span class=\"pdot\"></span><span class=\"plabel\">80 不设防</span></div>\n                    </div>\n                  </div>\n                  <progress id=\"prox\" value=\"36\" max=\"100\" style=\"display:none\" aria-hidden=\"true\"></progress>\n                </div>\n\n                <!-- 行为记录流水时间轴 -->\n                <ul class=\"timeline\" id=\"signal\" data-tip=\"只记事实：几点、她做了什么。为什么这么做——你自己判断。\">\n                  <li><time>21:14</time>便利店买热饮与饭团</li>\n                  <li><time>21:40</time>拐进昏暗窄巷小跑</li>\n                </ul>\n                <p class=\"assessment\" id=\"assess\" data-tip=\"「读时机」检定通过才出现的机会评估——机会等级对玩家永远不显数，只有这类模糊档位。\">读时机检定通过 · 此刻深水盲区绝佳机会</p>\n              </div>\n            </div>\n          </div>\n\n          <!-- 4. 环境战术沙盘（通栏专属卡片） -->\n          <div class=\"envbox wx-terminal-envbox\">\n            <div class=\"env-header\">\n              <h3><span class=\"section-no\">03</span><span data-tip=\"当前所在区域、场所与环境修正；战术沙盘显示相邻分支与逃跑预警。\">环境 · 战术沙盘</span></h3>\n              <span class=\"fam\" id=\"areaFam\" data-tip=\"区域熟悉度：同一区域累计 10 个场景段算熟。熟区内环境类刺激减半。\">熟悉 0/10</span>\n            </div>\n            <div class=\"env-fam-bar\">\n              <span class=\"label\">熟练度</span>\n              <div class=\"fam-meter\"><span class=\"fam-fill\" id=\"famFill\" style=\"width: 0%;\"></span></div>\n              <span id=\"famDesc\" class=\"label\">生疏</span>\n            </div>\n            <div class=\"envtags\" id=\"envTags\"></div>\n            \n            <div class=\"tactical-grid\" id=\"tacticalGrid\">\n              <div class=\"tactical-row\">\n                <span class=\"tactical-label\">相邻通路:</span>\n                <div class=\"tactical-chips\" id=\"exitChips\">\n                  <!-- 相邻出口 -->\n                </div>\n              </div>\n              <div class=\"tactical-row\" id=\"spotRow\">\n                <span class=\"tactical-label\">战术特殊位:</span>\n                <div class=\"tactical-chips\" id=\"spotChips\">\n                  <!-- 特殊位 -->\n                </div>\n              </div>\n              <div class=\"tactical-row\" id=\"alertRow\" data-tier=\"0\">\n                <span class=\"tactical-label\">她的警觉:</span>\n                <div class=\"tactical-chips\" id=\"alertChips\">\n                  <span class=\"alert-pips\" id=\"alertPips\"></span>\n                  <span class=\"alert-text\" id=\"alertText\" data-tip=\"0–20 · 她完全没觉得这晚有什么不对\">毫无察觉</span>\n                </div>\n              </div>\n              <div class=\"tactical-row\" id=\"sanctuaryRow\">\n                <span class=\"tactical-label\">逃跑预警:</span>\n                <div class=\"tactical-chips\" id=\"sanctuaryTip\">\n                  <!-- 逃跑预测 -->\n                </div>\n              </div>\n            </div>\n          </div>\n\n          <!-- 5. 底部深页导航与音频调控底栏 -->\n          <nav class=\"links wx-terminal-links\" aria-label=\"深页和声音入口\">\n            <div class=\"links-left wx-terminal-nav-buttons\">\n              <button type=\"button\" data-wx-dialog=\"wx-profile-dialog\" data-tip=\"已解锁情报条目、打量标签、已探日程。注意：面容记忆全暗，重叠那天才知道攒了多少。\">她的档案 ↗</button>\n              <button type=\"button\" data-wx-dialog=\"wx-lies-dialog\" data-tip=\"自己埋的雷：红点=易被查证、金点=可对质、灰点=无法验证；脉点=活跃，划线=已穿帮。\">我说过的话 ↗</button>\n              <button type=\"button\" data-wx-dialog=\"wx-wanted-dialog\" data-tip=\"追缉等级与已知效果。发酵进度不可见——你不知道他们离找到你多近。\">追缉 ↗</button>\n              <button type=\"button\" data-wx-dialog=\"wx-devices-dialog\" data-tip=\"已部署的跟踪定位器与微型摄像头状态监控。\">监控设备 ↗</button>\n            </div>\n            <div class=\"audio-popover-wrap\" id=\"audioPopoverWrap\">\n              <button type=\"button\" class=\"slim-btn audio-menu-btn\" id=\"audioMenuBtn\" data-tip=\"声音与环境音效设置\" aria-expanded=\"false\">\n                <span class=\"audio-ico\" aria-hidden=\"true\" data-ico=\"music\"></span> <span class=\"audio-btn-txt\" id=\"audioBtnTxt\">声音</span>\n              </button>\n              <div class=\"audio-popover-panel\" id=\"audioPopoverPanel\" style=\"display: none;\">\n                <div class=\"audio-popover-head\">\n                  <span class=\"audio-popover-title\">环境声音调控</span>\n                  <button type=\"button\" class=\"audio-master-switch\" id=\"heartbeat-sound\" aria-pressed=\"false\">开启雨夜心跳声</button>\n                </div>\n                <div class=\"audio-sliders-group\">\n                  <label class=\"audio-slider-item\"><span>心跳</span><input type=\"range\" id=\"volHeart\" min=\"0\" max=\"100\" value=\"80\" aria-label=\"心跳音量\"></label>\n                  <label class=\"audio-slider-item\"><span>雨声</span><input type=\"range\" id=\"volRain\" min=\"0\" max=\"100\" value=\"50\" aria-label=\"环境雨声音量\"></label>\n                  <label class=\"audio-slider-item\"><span>脚步声</span><input type=\"range\" id=\"volStep\" min=\"0\" max=\"100\" value=\"70\" aria-label=\"她的脚步声量\"></label>\n                  <label class=\"audio-slider-item\"><span>耳鸣</span><input type=\"range\" id=\"volTinn\" min=\"0\" max=\"100\" value=\"25\" aria-label=\"耳鸣音量\"></label>\n                </div>\n                <div class=\"audio-popover-status\" id=\"audioStatus\">音效已关闭</div>\n              </div>\n            </div>\n          </nav>\n        </div>\n        <!-- 沉底结算条：移出 .wx-modal-body 的滚动区，做弹窗真正的页脚\n             （放在滚动区内只能靠 sticky，内容会被压在条下露出半截） -->\n        <div class=\"ledger wx-terminal-ledger\" id=\"ledger\" data-tip=\"本楼结算摘要。\">本轮结算 · 体力 −3</div>\n    </dialog>\n    <dialog id=\"wx-item-dialog\" class=\"wx-dialog trpg\" aria-labelledby=\"item-title\"><div class=\"dialog-top\"><h2 id=\"item-title\">道具</h2><button type=\"button\" class=\"close-icon\" data-wx-close aria-label=\"关闭道具详情\">×</button></div><p class=\"item-meta\">持有数量：1</p><p id=\"item-description\"></p><p class=\"label\">当前仅预览道具详情，实际使用须接后台确认。</p><div class=\"dialog-actions\"><button type=\"button\" data-wx-close>返回</button></div></dialog>\n    <dialog id=\"wx-profile-dialog\" class=\"wx-dialog trpg\" aria-labelledby=\"profile-title\"><div class=\"dialog-top\"><h2 id=\"profile-title\">她的档案</h2><button type=\"button\" class=\"close-icon\" data-wx-close aria-label=\"关闭档案\">×</button></div>\n      <!-- 长焦偷拍取景器 -->\n      <div class=\"surv-viewfinder\">\n        <div class=\"vf-frame af-locked\" id=\"vfFrame\">\n          <span class=\"vf-corner tl\"></span><span class=\"vf-corner tr\"></span>\n          <span class=\"vf-corner bl\"></span><span class=\"vf-corner br\"></span>\n          <div class=\"vf-crosshair\"></div>\n          <div class=\"vf-header\">\n            <span class=\"vf-rec\"><i class=\"rec-dot\"></i>REC [长焦 85mm · F1.8]</span>\n            <div style=\"display:flex;align-items:center;gap:4px;\">\n              <span class=\"vf-meta\" id=\"vfMeta\">ISO 12800 · 1/60s · 距离 12m</span>\n              <span class=\"vf-af-badge\" id=\"vfAfBadge\">[ AF-LOCK ]</span>\n            </div>\n          </div>\n          <div class=\"vf-scene\" aria-hidden=\"true\">\n            <svg class=\"vf-canvas\" viewBox=\"0 0 440 140\" preserveAspectRatio=\"xMidYMid slice\">\n              <defs>\n                <linearGradient id=\"vfNightSky\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">\n                  <stop offset=\"0%\" stop-color=\"#080d14\"/>\n                  <stop offset=\"60%\" stop-color=\"#111822\"/>\n                  <stop offset=\"100%\" stop-color=\"#182330\"/>\n                </linearGradient>\n                <linearGradient id=\"vfPuddleGlow\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">\n                  <stop offset=\"0%\" stop-color=\"#ffd580\" stop-opacity=\"0.25\"/>\n                  <stop offset=\"100%\" stop-color=\"#2a3848\" stop-opacity=\"0.02\"/>\n                </linearGradient>\n              </defs>\n              <rect width=\"440\" height=\"140\" fill=\"url(#vfNightSky)\"/>\n              <!-- 远景街灯晕光与便利店灯箱 -->\n              <circle cx=\"320\" cy=\"35\" r=\"45\" fill=\"#f5d483\" opacity=\"0.1\" filter=\"blur(16px)\"/>\n              <line x1=\"320\" y1=\"35\" x2=\"320\" y2=\"120\" stroke=\"#253444\" stroke-width=\"2\"/>\n              <rect x=\"35\" y=\"32\" width=\"55\" height=\"18\" rx=\"2\" fill=\"#e89d58\" opacity=\"0.2\"/>\n              <!-- 湿滑积水倒影区 -->\n              <polygon points=\"140,115 350,115 390,140 90,140\" fill=\"url(#vfPuddleGlow)\"/>\n              <!-- 雨丝线条 -->\n              <g stroke=\"#56728f\" stroke-width=\"0.8\" opacity=\"0.3\">\n                <line x1=\"40\" y1=\"10\" x2=\"30\" y2=\"40\"/><line x1=\"120\" y1=\"5\" x2=\"110\" y2=\"35\"/>\n                <line x1=\"200\" y1=\"15\" x2=\"190\" y2=\"45\"/><line x1=\"280\" y1=\"0\" x2=\"270\" y2=\"30\"/>\n                <line x1=\"360\" y1=\"20\" x2=\"350\" y2=\"50\"/><line x1=\"80\" y1=\"60\" x2=\"70\" y2=\"90\"/>\n                <line x1=\"160\" y1=\"70\" x2=\"150\" y2=\"100\"/><line x1=\"240\" y1=\"65\" x2=\"230\" y2=\"95\"/>\n                <line x1=\"320\" y1=\"55\" x2=\"310\" y2=\"85\"/><line x1=\"400\" y1=\"75\" x2=\"390\" y2=\"105\"/>\n              </g>\n              <!-- 目标 OL 撑伞快步剪影 -->\n              <g transform=\"translate(215, 30)\">\n                <path d=\"M -34 30 Q 0 -2 34 30 Q 0 24 -34 30 Z\" fill=\"#17222c\" stroke=\"#36495c\" stroke-width=\"1.2\"/>\n                <ellipse cx=\"0\" cy=\"32\" rx=\"6.5\" ry=\"7.5\" fill=\"#10151c\"/>\n                <path d=\"M -6 38 Q 0 41 7 38 L 6 45 Q 0 47 -6 45 Z\" fill=\"#7a5a54\"/>\n                <path d=\"M -10 44 L -14 76 L 14 76 L 10 44 Z\" fill=\"#29333d\"/>\n                <line x1=\"-5\" y1=\"76\" x2=\"-7\" y2=\"94\" stroke=\"#161b22\" stroke-width=\"2.5\"/>\n                <line x1=\"5\" y1=\"76\" x2=\"8\" y2=\"90\" stroke=\"#161b22\" stroke-width=\"2.5\"/>\n                <rect x=\"12\" y=\"60\" width=\"8\" height=\"12\" rx=\"1.5\" fill=\"#c3d2e0\" opacity=\"0.6\"/>\n              </g>\n            </svg>\n            <div class=\"vf-scanline\"></div>\n          </div>\n          <div class=\"vf-footer\">\n            <span class=\"vf-tag\">目标·外企OL · 档案编号 #OL-01</span>\n            <span class=\"vf-status\">长焦定焦 · 雨夜暗巷背影快照</span>\n          </div>\n        </div>\n      </div>\n      <h3 style=\"margin-top:14px\">属性 <small class=\"label\" style=\"font-weight:normal\">打量大成功可揭示真实数值；未查明前显示为 ？</small></h3>\n      <div class=\"pattrs\" id=\"pattrs\">\n        <div class=\"pattr unknown\"><div class=\"an\">体格</div><div class=\"av\">？</div></div>\n        <div class=\"pattr unknown\"><div class=\"an\">敏捷</div><div class=\"av\">？</div></div>\n        <div class=\"pattr\" data-tip=\"敏锐 7：专业级的观察力——尾行最难骗过的眼睛\"><div class=\"an\">敏锐</div><div class=\"av\">7</div></div>\n        <div class=\"pattr unknown\"><div class=\"an\">胆量</div><div class=\"av\">？</div></div>\n      </div>\n      <h3 style=\"margin-top:14px\">身体印象</h3>\n      <div id=\"ptags\"><span class=\"tag\" data-tip=\"模糊印象：只知道大致范围，打量大成功可揭示准确数值\">身材匀称</span></div>\n      <h3 style=\"margin-top:14px\">已解锁情报</h3>\n      <p id=\"profileBody\">今晚在便利店买了两盒便当。</p><p class=\"label\">正式数据：已解锁条目 + 已探日程。她的心事不在此列。</p>\n      <div class=\"dialog-actions\"><button type=\"button\" data-wx-close>返回</button></div></dialog>\n    <dialog id=\"wx-lies-dialog\" class=\"wx-dialog trpg\" aria-labelledby=\"lies-title\"><div class=\"dialog-top\"><h2 id=\"lies-title\">我说过的话</h2><button type=\"button\" class=\"close-icon\" data-wx-close aria-label=\"关闭谎账\">×</button></div>\n      <div class=\"lie-legend\" data-tip=\"谎话分三档：身份职业类的谎会被查证；说法行踪类的谎可能被对质；借口感受类的谎几乎无法验证。档位越高，穿帮的雷越响。\">\n        <span><i class=\"dot v-high\"></i>查证类</span><span><i class=\"dot v-mid\"></i>对质类</span><span><i class=\"dot v-low\"></i>无法验证</span>\n      </div>\n      <div id=\"liesBody\"></div>\n      <p class=\"label\">每句谎都是埋进存档的雷：她会验证，穿帮那天一起塌。</p>\n      <div class=\"dialog-actions\"><button type=\"button\" data-wx-close>返回</button></div></dialog>\n    <dialog id=\"wx-wanted-dialog\" class=\"wx-dialog trpg\" aria-labelledby=\"wanted-title\"><div class=\"dialog-top\"><h2 id=\"wanted-title\">追缉</h2><button type=\"button\" class=\"close-icon\" data-wx-close aria-label=\"关闭追缉\">×</button></div><p id=\"wantedBody\">当前等级：无。</p><p class=\"label\">等级与已知效果；发酵进度不可见。</p><div class=\"dialog-actions\"><button type=\"button\" data-wx-close>返回</button></div></dialog>\n    <dialog id=\"wx-devices-dialog\" class=\"wx-dialog trpg\" aria-labelledby=\"devices-title\"><div class=\"dialog-top\"><h2 id=\"devices-title\">设备</h2><button type=\"button\" class=\"close-icon\" data-wx-close aria-label=\"关闭设备面板\">×</button></div>\n      <div class=\"dev-card\" data-tip=\"微型定位器嵌在小物件里。屏幕上她是一个红点：知道在哪、动没动、朝哪走。红点看不见她买了什么、和谁并排走——那些要靠你自己靠近。\">\n        <div class=\"dev-head\"><span class=\"dev-name\"><span class=\"dev-ico\" data-ico=\"pin\"></span>定位器</span><span class=\"dev-state\">在线</span></div>\n        <div class=\"dev-where\"><span class=\"dev-loc\">城东 · 青柳街便利店</span><span class=\"dev-mot\">静止</span></div>\n        <div class=\"dev-time\">22:41 更新</div>\n        <ol class=\"dev-feed\">\n          <li><time>21:12</time>离开公司</li>\n          <li><time>21:40</time>绕开了常走的滨河路</li>\n        </ol>\n        <p class=\"dev-note\">路线的偏离本身就是消息——有事发生，或者，她起了戒心。</p>\n      </div>\n      <div class=\"dev-card\" data-tip=\"装进她家里的眼睛。三档：存储款——画面存在机内，每隔三四天要回一趟现场换卡；无线款——走她家网络直连这页，但她家路由器会多出一台陌生设备；防水款——浴室专用，藏得进排风扇和洗发水瓶。拍到的画面每晚归档——直到哪天被她翻出来，那会是另一件事的开始。\">\n        <div class=\"dev-head\"><span class=\"dev-name\"><span class=\"dev-ico\" data-ico=\"video\"></span>监控 <span class=\"dev-sub\">存储款 · 卧室</span></span><span class=\"dev-state\">在线</span></div>\n        <!-- 数据契约：安装后由中控 snapshot 填充；帧图片路径约定 assets/cam/（素材线出图：洗澡/换衣等场景帧），caption 为拍摄位与时间戳；素材未接入时保持 no-feed 噪点占位 -->\n        <div class=\"dev-frame no-feed\" id=\"camFrameBox\"><img id=\"camFrame\" alt=\"监控画面\" hidden><span class=\"dev-frame-rec\" aria-hidden=\"true\">REC</span><span class=\"dev-frame-cap\" id=\"camFrameCap\">卧室 · 22:47</span></div>\n        <p class=\"dev-note\">距下次取卡 2 天——每 3~4 天要回一趟现场。</p>\n      </div>\n      <p class=\"label\">设备的动静都汇总在这页；要紧的变化（她到家、路线偏了）会直接弹到状态栏上。</p>\n      <div class=\"dialog-actions\"><button type=\"button\" id=\"openAlbumBtn\">相册 ↗</button><button type=\"button\" data-wx-close>返回</button></div></dialog>\n\n    <!-- ═══ 相册：贴墙收集（拍照产物） ═══ -->\n    <dialog id=\"wx-album-dialog\" class=\"wx-dialog trpg wx-album-dialog\" aria-labelledby=\"album-title\">\n      <div class=\"dialog-top\">\n        <h2 id=\"album-title\">相册 <span class=\"album-count\" id=\"albumCount\">0 / 0</span></h2>\n        <button type=\"button\" class=\"close-icon\" data-wx-close aria-label=\"关闭相册\">×</button>\n      </div>\n      <div class=\"album-wall\" id=\"albumWall\"></div>\n      <div class=\"album-detail\" id=\"albumDetail\" hidden>\n        <img id=\"albumDetailImg\" alt=\"照片\">\n        <div class=\"album-detail-meta\" id=\"albumDetailMeta\"></div>\n      </div>\n      <div class=\"dialog-actions\"><button type=\"button\" data-wx-close>返回</button></div>\n    </dialog>\n\n    <!-- 拍照即时卡片（6 秒后自动消失） -->\n    <div class=\"photo-toast\" id=\"photoToast\" hidden>\n      <img id=\"photoToastImg\" alt=\"\">\n      <div class=\"photo-toast-txt\"><b id=\"photoToastName\"></b><span id=\"photoToastMeta\"></span></div>\n    </div>\n    <!-- ═══ 零楼 · 开局两步走向导（第一步：猎手身份属性 ➔ 第二步：锁定目标角色；新局无档时自动打开） ═══ -->\n    <dialog id=\"wx-create-dialog\" class=\"wx-dialog trpg wx-create-dialog\" aria-labelledby=\"createTitle\">\n      <div class=\"dialog-top zero-wizard-top\">\n        <div class=\"zero-title-wrap\">\n          <h2 id=\"createTitle\">零楼 · 创角向导</h2>\n          <span class=\"zero-sub\">建局向导 · 零楼数零 token</span>\n        </div>\n        <!-- 步骤导航条 -->\n        <div class=\"zero-steps-bar\" role=\"tablist\" aria-label=\"零楼向导步骤\">\n          <button type=\"button\" class=\"zero-step-pill active\" id=\"zeroStepTab1\" data-step=\"1\">\n            <span class=\"step-num\">1</span>\n            <span class=\"step-text\">猎手身份属性</span>\n          </button>\n          <span class=\"zero-step-divider\">➔</span>\n          <button type=\"button\" class=\"zero-step-pill\" id=\"zeroStepTab2\" data-step=\"2\">\n            <span class=\"step-num\">2</span>\n            <span class=\"step-text\">锁定目标角色</span>\n          </button>\n        </div>\n        <button type=\"button\" class=\"close-icon\" id=\"createCloseBtn\" data-wx-close aria-label=\"关闭开局面板\" hidden>×</button>\n      </div>\n\n      <!-- ─── 步骤 1：猎手身份与点数 ─── -->\n      <div class=\"zero-step-view\" id=\"zeroStep1\">\n        <div class=\"create-tabs\">\n          <button type=\"button\" class=\"create-tab active\" data-ctab=\"quick\">快捷预设</button>\n          <button type=\"button\" class=\"create-tab\" data-ctab=\"custom\">自定义加点</button>\n        </div>\n        <div class=\"create-pane\" data-cpane=\"quick\" id=\"quickPane\"></div>\n        <div class=\"create-pane\" data-cpane=\"custom\" id=\"customPane\" hidden>\n          <div class=\"id-grid\" id=\"idGrid\"></div>\n          <div class=\"alloc\" id=\"allocBox\">\n            <div class=\"alloc-head\">\n              <span class=\"label\">分 20 点（每项 1~10，身份修正在此之上另算）</span>\n              <span class=\"alloc-remain\" id=\"allocRemain\">剩余 0</span>\n            </div>\n            <div id=\"allocRows\"></div>\n            <p class=\"alloc-warn\" id=\"allocWarn\"></p>\n          </div>\n        </div>\n        <div class=\"create-foot\">\n          <span class=\"create-hint\" id=\"createHint\">选一个身份，把点数分完</span>\n          <button type=\"button\" class=\"zero-btn-next\" id=\"zeroNextStep\" disabled>下一步：选择目标 ➔</button>\n        </div>\n      </div>\n\n      <!-- ─── 步骤 2：锁定目标猎物 ─── -->\n      <div class=\"zero-step-view\" id=\"zeroStep2\" hidden>\n        <div class=\"target-section-head\">\n          <span class=\"label\">选择跟踪目标（六大目标角色库 · 数据与动线插槽已预留）</span>\n          <span class=\"target-sub-note\">当前首发已完全填充：独居女大学生（2★）</span>\n        </div>\n        <div class=\"target-grid\" id=\"targetGrid\"></div>\n        <div class=\"target-detail-box\" id=\"targetDetailBox\">\n          <div class=\"target-detail-header\">\n            <div class=\"target-detail-title-wrap\">\n              <span class=\"target-detail-name\" id=\"tDetailName\">疲惫的OL</span>\n              <span class=\"target-detail-stars\" id=\"tDetailStars\">★★☆☆☆</span>\n              <span class=\"target-detail-badge\" id=\"tDetailBadge\">疲惫猎</span>\n              <span class=\"target-status-badge ready\" id=\"tDetailStatus\">完整动线就绪</span>\n            </div>\n            <div class=\"target-detail-action-wrap\">\n              <button type=\"button\" class=\"btn-reroll-target\" id=\"tDetailReroll\" title=\"重新随机摇号目标的姓名、性格、爱好与属性扰动\"><span class=\"btn-ico\" data-ico=\"dice\"></span> 重新摇号</button>\n              <span class=\"target-detail-area\" id=\"tDetailArea\">中城CBD ➔ 老城文教区</span>\n            </div>\n          </div>\n          <p class=\"target-detail-tagline\" id=\"tDetailTagline\">写字楼深夜加完班，高跟鞋敲打在老城夜雨里</p>\n          <div class=\"target-detail-rows\">\n            <div class=\"target-row\"><b>目标真名</b><span class=\"target-gen-name\" id=\"tDetailRealName\">林晚秋</span><span class=\"target-gen-sub\" id=\"tDetailNameSource\">(中式姓名库 10×20 随机生成)</span></div>\n            <div class=\"target-row\"><b>性格特质</b><span id=\"tDetailPersonality\"><span class=\"tag personality\" data-tip=\"【性格·慢热】防备心重，生人社交与搭话检定修正 -2\">慢热</span></span></div>\n            <div class=\"target-row\"><b>私密爱好</b><span id=\"tDetailHobby\"><span class=\"tag hobby\" data-tip=\"【爱好·胶片探店】常在街角橱窗停顿取景，尾随近身检定 +1\">胶片探店</span></span></div>\n            <div class=\"target-row\"><b>鞋具着装</b><span id=\"tDetailShoe\"><span class=\"tag equipment\" data-tip=\"【鞋具·高跟鞋】细高跟鞋，步频清脆，跟钉敲击回响，驱动高跟鞋脚步声\">高跟鞋</span></span></div>\n            <div class=\"target-row\"><b>特征标签</b><span id=\"tDetailFeatures\">深夜加班窗口 · [疲惫] 敏锐降低 · 高跟鞋步频清脆</span></div>\n            <div class=\"target-row\"><b>作息规律</b><span id=\"tDetailWindow\">工作日 21:00 起下班，疲惫下防备较低，但动线跨区较长</span></div>\n            <div class=\"target-row\"><b>情报评估</b><span id=\"tDetailStats\">体格 <b>？</b> · 敏捷 <b>？</b> · 敏锐 <b>？</b> · 胆量 <b>？</b> · 社交 <b>？</b> <small class=\"label\" style=\"margin-left:6px\">（情报迷雾 · 打量或调查后揭示）</small></span></div>\n          </div>\n\n        </div>\n        <div class=\"create-foot\">\n          <button type=\"button\" class=\"zero-btn-prev\" id=\"zeroPrevStep\">⬅ 上一步：修改猎手</button>\n          <span class=\"create-hint\" id=\"targetHint\">已锁定：疲惫的OL</span>\n          <button type=\"button\" class=\"create-confirm\" id=\"createConfirm\">锁定目标 · 步入夜色 ➔</button>\n        </div>\n      </div>\n    </dialog>\n    <!-- ═══ 身份徽记详情（常驻条徽记点开；含重开新局） ═══ -->\n    <dialog id=\"wx-id-dialog\" class=\"wx-dialog trpg\" aria-labelledby=\"idTitle\">\n      <div class=\"dialog-top\">\n        <h2 id=\"idTitle\">身份</h2>\n        <button type=\"button\" class=\"close-icon\" data-wx-close aria-label=\"关闭身份详情\">×</button>\n      </div>\n      <div id=\"idDetailBody\"></div>\n      <div class=\"dialog-actions\">\n        <button type=\"button\" id=\"idResetBtn\" data-tip=\"清空本局进度，回到零楼重新选择身份与点数\">重开新局</button>\n        <button type=\"button\" data-wx-close>返回</button>\n      </div>\n    </dialog>\n    <!-- ═══ M4-2 三翼战术 Canvas 判定台（数已定，演出与生成同时进行；确认结果收面板） ═══ -->\n    <dialog id=\"wx-settle-dialog\" class=\"wx-dialog trpg\" aria-labelledby=\"settleTitle\">\n      <div class=\"dialog-top\">\n        <h2 id=\"settleTitle\">判定 · 本楼结算</h2>\n        <button type=\"button\" class=\"close-icon\" data-wx-close aria-label=\"关闭结算面板\">×</button>\n      </div>\n      <div id=\"settleBody\" class=\"settle-body\">\n        <div class=\"stage-console\" id=\"settleConsole\">\n          <!-- ① 左翼：因 · 检定态势与筹码装填 -->\n          <div class=\"wing wing-left\">\n            <div class=\"wing-header\">\n              <span class=\"wing-tag\">INPUT</span>\n              <span class=\"wing-title\">检定态势与筹码</span>\n            </div>\n            <div class=\"action-badge\" id=\"settleActBadge\">▸ 准备就绪</div>\n            <div class=\"mods-stack\" id=\"settleModsStack\"></div>\n            <div class=\"ekg-widget\">\n              <div class=\"ekg-top\">\n                <span>生理监护</span>\n                <span class=\"bpm\" id=\"settleEkgHeart\">58 BPM · 甜区</span>\n              </div>\n              <svg class=\"ekg-svg\" viewBox=\"0 0 200 24\" aria-hidden=\"true\">\n                <path class=\"ekg-trace\" d=\"M0,12 L35,12 L40,6 L45,18 L50,12 L80,12 L85,2 L92,22 L98,12 L130,12 L135,8 L140,16 L145,12 L200,12\"/>\n              </svg>\n            </div>\n          </div>\n\n          <!-- ② 中央：宿命 · 3D 物理晶体 20 面骰 -->\n          <div class=\"stage-center\">\n            <div class=\"corner c-tl\"></div><div class=\"corner c-tr\"></div>\n            <div class=\"corner c-bl\"></div><div class=\"corner c-br\"></div>\n            <div class=\"hud-status\" id=\"settleHudStatus\">TARGET TRACKING · D20 READY</div>\n            <div class=\"radar-ring\"></div>\n            <div class=\"die-stage-center\">\n              <div class=\"die-shadow\" id=\"settleDieShadow\"></div>\n              <canvas id=\"settleDieCanvas\" width=\"500\" height=\"500\"></canvas>\n            </div>\n            <div class=\"flash-overlay\" id=\"settleFlashOverlay\"></div>\n          </div>\n\n          <!-- ③ 右翼：果 · 判定结论与即时账目 -->\n          <div class=\"wing wing-right\">\n            <div class=\"wing-header\">\n              <span class=\"wing-tag\">OUTPUT</span>\n              <span class=\"wing-title\">判定结论与账目</span>\n            </div>\n            <div class=\"verdict-box\">\n              <div class=\"verdict-badge\" id=\"settleVerdictBadge\">待判定</div>\n              <div class=\"math-line\" id=\"settleMathLine\">—</div>\n            </div>\n            <div class=\"ledger-wrap\" id=\"settleLedgerWrap\">\n              <div class=\"ledger-row show\"><span>等待掷骰结果落定 …</span></div>\n            </div>\n            <div class=\"dark-reveal-card\" id=\"settleDarkRevealCard\"></div>\n            <div class=\"queue-history\" id=\"settleQueueHistory\" style=\"display:none;\"></div>\n          </div>\n        </div>\n      </div>\n      <div class=\"dialog-actions settle-actions\">\n        <label class=\"settle-auto\"><input type=\"checkbox\" id=\"settleAuto\"> 自动掷（跳过面板，旧流程结算）</label>\n        <button type=\"button\" id=\"settleAck\" class=\"settle-ack\">确认结果</button>\n      </div>\n    </dialog>";

    if (sendForm && sendForm.parentNode) {
      sendForm.parentNode.insertBefore(root, sendForm);
    } else if (formSheld) {
      formSheld.insertBefore(root, formSheld.firstChild);
    } else if (chat && chat.parentNode) {
      chat.parentNode.insertBefore(root, chat.nextSibling);
    } else {
      topDoc.body.appendChild(root);
    }

    // 提升全部原生模态对话框（战术终端、档案、谎账、追缉、设备、道具）至独立容器，确保作用域干净
    var modalsRoot = topDoc.createElement("div");
    modalsRoot.id = "wx-modals-root";
    modalsRoot.className = "trpg";
    topDoc.body.appendChild(modalsRoot);

    root.querySelectorAll("dialog").forEach(function(d) {
      d.classList.add("wx-dialog", "trpg");
      modalsRoot.appendChild(d);
    });

    // 3. 运行状态栏 HUD 逻辑（利用参数阴影将 document 与 window 绑定到 topDoc 与 topWin）
    try {
      (function(document, window) {
        /* ═══ 尾行状态栏 · 真机底稿 ═══
   数据接口 = 中控 game.js snapshot()：
   { player:{heart,stamina,cash,pi,proximity,date}, target:{alertStage,warinessStage},
     mode, dist, env, slot, tags:[{name,owner,duration}] }
   真机接入两条道：①宿主逐楼注入 renderSnapshot(中控快照)；②「真机回放」加载
   tools/drive.mjs 生成的 replay.json（引擎逐楼真快照）——mock 仅作无数据时的演示兜底。 */
(() => {
  const root = document.querySelector('.trpg');

  /* ---------- C4 · 单色图标集（24×24，stroke 1.6，currentColor；只在结构/脚本里，不引外部资源） ----------
     文字符号（➔ ⬅ ↗ ▾ ★ ✓ ♥）本来就是单色的，保留；这里换的是会带颜色的图形 emoji。 */
  const WX_ICON = {
    rain:   '<path d="M6.5 13.5h11a3 3 0 0 0 0-6 4.5 4.5 0 0 0-8.6-1 3.2 3.2 0 0 0-2.4 7Z"/><path d="M8 16.5 7 19M12 16.5 11 19M16 16.5 15 19"/>',
    storm:  '<path d="M6.5 12.5h11a3 3 0 0 0 0-6 4.5 4.5 0 0 0-8.6-1 3.2 3.2 0 0 0-2.4 7Z"/><path d="M12 14.5 10 18h3l-1 3 4-5h-3l1-1.5"/>',
    sunny:  '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>',
    moon:   '<path d="M20 14.5A8 8 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
    school: '<path d="M3 10 12 4l9 6"/><path d="M5 10v10h14V10"/><path d="M9 20v-5h6v5"/>',
    store:  '<path d="M4 9h16l-1.5-5H5.5L4 9Z"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/>',
    alley:  '<path d="M9 3h6"/><path d="M10 3v2h4V3"/><path d="M8 7h8l-1 6H9L8 7Z"/><path d="M12 13v8"/>',
    door:   '<path d="M6 21V4h9v17"/><path d="M4 21h16"/><path d="M12.5 12.5h.01"/>',
    subway: '<rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 10h14"/><path d="M8 20l2-4M16 20l-2-4"/>',
    bridge: '<path d="M3 18h18"/><path d="M5 18V9a7 7 0 0 1 14 0v9"/><path d="M12 18v-8"/>',
    office: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>',
    parking:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M10 17V8h3a3 3 0 0 1 0 6h-3"/>',
    bar:    '<path d="M4 5h16l-8 9Z"/><path d="M12 14v6"/><path d="M8 20h8"/>',
    unknown:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6"/><path d="M12 16.8h.01"/>',
    tool:   '<path d="M14.5 4a3.5 3.5 0 0 0-3 5.3L4 16.8 7.2 20l7.5-7.5A3.5 3.5 0 0 0 19 8.5l-2 1.2-1.7-1.7 1.2-2A3.5 3.5 0 0 0 14.5 4Z"/>',
    tech:   '<rect x="5" y="4" width="14" height="10" rx="1.5"/><path d="M3 18h18l-2-4H5l-2 4Z"/>',
    device: '<path d="M4 8h4l2-2h4l2 2h4v11H4V8Z"/><circle cx="12" cy="13" r="3"/>',
    mask:   '<path d="M4 9c3-2 6-2 8 0 2-2 5-2 8 0v3c0 4-4 7-8 7s-8-3-8-7V9Z"/><path d="M8 11.5h1.8M14.2 11.5H16"/>',
    bolt:   '<path d="M13 3 6 13h5l-1 8 8-11h-5l1-7Z"/>',
    cup:    '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H6a2 2 0 0 0 0 4h2"/><path d="M10 20h4M12 13v7"/>',
    bag:    '<path d="M7 8h10a2 2 0 0 1 2 2v10H5V10a2 2 0 0 1 2-2Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/><path d="M9 13h6"/>',
    box:    '<path d="M4 8l8-4 8 4v8l-8 4-8-4V8Z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
    paw:    '<circle cx="7.5" cy="9" r="1.6"/><circle cx="12" cy="7" r="1.6"/><circle cx="16.5" cy="9" r="1.6"/><path d="M8 14c-1.6 1-2 2.4-1.4 3.4.7 1.1 2.6 1.3 4.2.6 1.6.7 3.5.5 4.2-.6.6-1 .2-2.4-1.4-3.4-1.5-1-4.1-1-5.6 0Z"/>',
    phone:  '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10.5 18h3"/>',
    clip:   '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5V3.5h6V5"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/>',
    music:  '<path d="M9 18V6l9-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="16" cy="16" r="2"/>',
    person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5"/>',
    pin:    '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    video:  '<rect x="3" y="7" width="12" height="10" rx="2"/><path d="M15 11l6-3v8l-6-3"/>',
    dice:   '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="12" cy="12" r="1"/>',
    warn:   '<path d="M12 4 3 20h18L12 4Z"/><path d="M12 10v5"/><path d="M12 18h.01"/>'
  };
  const ico = (name) =>
    `<svg class="wx-ico wx-ico-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${WX_ICON[name] || WX_ICON.unknown}</svg>`;
  /** 去掉文本里的彩色 emoji（mock 数据与 LLM 文案都可能带），图标由 ico() 统一补。
      只清图形 emoji 与杂符号，箭头（↗ ← ➔）、几何形（▾ ★ ✓）等文字符号保留。 */
  const stripEmoji = (s) => String(s || '').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}]/gu, '').replace(/\s+/g, ' ').trim();

  /* 结构里用 data-ico="name" 占位，统一在这里补成 SVG（含首帧未渲染时的兜底态） */
  const fillStaticIcons = () => {
    document.querySelectorAll('[data-ico]').forEach(el => {
      if (el.dataset.icoFilled) return;
      el.insertAdjacentHTML('beforeend', ico(el.dataset.ico));
      el.dataset.icoFilled = '1';
    });
  };
  fillStaticIcons();

  /* ---------- 规格常量（数值策划 v0.5 直译） ---------- */
  const SWEET = [40, 65];
  const LINES = [70, 90];   // 操作线全员统一（v0.8 清账：老手/新手双轨废弃）
  const heartToBpm = v =>
    v<40 ? 45+v*0.25 : v<65 ? 55+(v-40)*0.8 : v<90 ? 75+(v-65)*1.2 : 105+(v-90)*2.5;
  const heartFreq  = v => v>=90 ? 50 : 58;                          // 失控下移变闷
  const DIST_NAMES = { far:'目视远端', same:'同街', close:'身后', touch:'贴身' };
  const SLOT_NAMES = { prepare:'准备', e18_21:'行动窗口', e21_23:'行动窗口', e23_01:'深夜窗口', late:'凌晨窗口' };
  const MODE_NAMES = { prepare:'准备期', stealth:'潜行', contact:'接触', vehicle:'车厢' };

  /* ---------- 演示快照（结构与中控 snapshot() 一致） ---------- */
  const MOCKS = {
    sweet:  { player:{heart:58,stamina:72,cash:240,pi:18,proximity:36,date:3,attrs:{str:2,agi:4,nrv:3,int:8,cha:8}}, target:{alertStage:1,warinessStage:'低',shoe:'heel'},
              mode:'stealth', dist:'same', env:'rainNight', slot:'e21_23',
              area:'老城文教区', place:'居民杂物暗巷', weather:'rain', weatherName:'小雨', strikeSealed:false, fam:7,
              route:{nodes:['学校正门','老水泥天桥','24h便利店','居民杂物暗巷','老旧单元楼道'],known:[1,0,1,1,0],here:3},
              exits:['老旧单元楼道 (前)', '盲端死胡同 (侧)', '24h便利店 (后)'],
              spots:['垃圾桶躲藏 隐蔽+2', '变换步态 认人对抗+1'],
              sanctuaryAlert:'若目标受惊：将本能原路折返逃向后方 [24h便利店] (距离1步)',
              tags:[{name:'优势：情报',owner:'player',duration:'flag'},{name:'耳机伪装',owner:'player',duration:'flag'},{name:'雨幕',owner:'scene',duration:'flag'},{name:'湿滑',owner:'scene',duration:'flag'},{name:'提速',owner:'target',duration:'scene',count:2}],
              inventory:[
                { id:'lockpick', name:'开锁工具', type:'tool', slot:'tool', count:1, equipped:true, canEquip:true, canUse:false, desc:'潜入工具：解锁开锁路线，敏捷检定+4', effectsDesc:'开锁路线敏捷+4' },
                { id:'energy_drink', name:'能量饮料', type:'consumable', slot:null, count:1, equipped:false, canEquip:false, canUse:true, desc:'消耗品：夜间专供续命，体力+20但心跳+10', effectsDesc:'体力+20·心跳+10(夜专供)' },
                { id:'cam_storage', name:'针孔摄像机(存储档)', type:'device', slot:null, count:1, equipped:false, canEquip:false, canUse:false, desc:'数字监控设备：居家日程补全，心事线直达', effectsDesc:'日程补全·心事线直达' }
              ],
              proxLog:[
                '+10 · 假装顺路帮按电梯门 (昨晚)',
                '+5  · 掉落纸巾拾还 (昨晚)',
                '+3  · 同店收银台对视 (今早)',
                '-2  · 跟太近引其侧目拉开距离 (前夜)',
                '+4  · 便利店同买关东煮搭话 (刚才)'
              ],
              signal:[['21:14','便利店买热饮与饭团'],['21:40','拐进昏暗窄巷小跑']], assess:'读时机检定通过 · 此刻深水盲区绝佳机会',
              ledger:'本轮结算 · 体力 −3 · 隐蔽稳妥', herAlert:'她 · 抱紧背包' },    deform: { player:{heart:78,stamina:43,cash:240,pi:18,proximity:36,date:3,attrs:{str:2,agi:4,nrv:3,int:8,cha:8}}, target:{alertStage:2,warinessStage:'中',shoe:'heel'},
              mode:'stealth', dist:'close', env:'night', slot:'e18_21',
              area:'中城CBD商务区', place:'写字楼大堂', weather:'clear', weatherName:'晴夜', strikeSealed:true, fam:3,
              route:{nodes:['写字楼大堂','跨街天桥','地铁枢纽','沿街便利店','B2地下车库'],known:[1,1,1,0,0],here:0},
              exits:['跨街天桥 (前)', '地铁枢纽出入口 (侧)', 'B2地下车库 (下)'],
              spots:['保安钟巡检 1d20+2 vs 10', '前台访客登记'],
              sanctuaryAlert:'人流密集公立探头直照，终局强攻锁定',
              tags:[{name:'操作变形',owner:'player',duration:'flag'},{name:'人流掩护',owner:'scene',duration:'flag'}],
              inventory:[
                { id:'climb_gear', name:'攀爬套装', type:'tool', slot:'tool', count:1, equipped:true, canEquip:true, canUse:false, desc:'潜入工具：攀上与落地检定+2，声响降档', effectsDesc:'攀爬/落地+2·声响降档' },
                { id:'bento', name:'便当', type:'consumable', slot:null, count:1, equipped:false, canEquip:false, canUse:true, desc:'消耗品：三餐额度，使用即恢复体力+20', effectsDesc:'体力+20' }
              ],
              proxLog:[
                '+5  · 地铁站同节车厢 (前天)',
                '+8  · 雨天同廊檐避雨 (昨天)',
                '+2  · 咖啡店前后排队 (昨晚)',
                '-4  · 走得太急踩到水洼被注意 (刚才)',
                '+3  · 自称新来的物业管家 (刚才)'
              ],
              signal:[['22:05','打卡刷闸机出楼'],['22:11','高跟鞋急促回响']], assess:'', ledger:'本轮结算 · 心跳 +17 · 警觉 +2',
              herAlert:'她 · 左右张望' },
    crash:  { player:{heart:93,stamina:18,cash:240,pi:18,proximity:36,date:3,attrs:{str:2,agi:4,nrv:3,int:8,cha:8}}, target:{alertStage:3,warinessStage:'中',shoe:'heel'},
              mode:'contact', dist:'touch', env:'rainNight', slot:'late',
              area:'临江娱乐红灯区', place:'一线天幽湿窄弄', weather:'storm', weatherName:'暴雨 (湿滑)', strikeSealed:false, fam:9,
              route:{nodes:['酒吧员工后门','大排档夜市','沿江便利店','一线天幽湿窄弄','出租屋楼道铁门'],known:[1,1,1,1,1],here:3},
              exits:['出租屋楼道铁门 (前)', '共用杂物天台 (上)', '城中村握手楼主弄 (后)'],
              spots:['空调滴水掩盖', '阴湿窄墙死角'],
              sanctuaryAlert:'若目标受惊：将拼死逃向后方 [大排档夜市] (距离2步)',
              tags:[{name:'操作变形',owner:'player',duration:'flag'},{name:'操作崩溃',owner:'player',duration:'flag'},{name:'暴雨喧嚣',owner:'scene',duration:'flag'},{name:'地面湿滑',owner:'scene',duration:'flag'}],
              inventory:[
                { id:'lockpick', name:'开锁工具', type:'tool', slot:'tool', count:1, equipped:true, canEquip:true, canUse:false, desc:'潜入工具：解锁开锁路线，敏捷检定+4', effectsDesc:'开锁路线敏捷+4' },
                { id:'energy_drink', name:'能量饮料', type:'consumable', slot:null, count:1, equipped:false, canEquip:false, canUse:true, desc:'消耗品：夜间专供续命，体力+20但心跳+10', effectsDesc:'体力+20·心跳+10(夜专供)' }
              ],
              proxLog:[
                '+10 · 晚归雨夜同路 (3天前)',
                '+15 · 出租屋楼下替其扶车 (前天)',
                '+12 · 假装同楼租客借火 (昨天)',
                '-5  · 眼神停留太久被盯防 (刚才)',
                '+8  · 酒吧后门搀扶借力 (刚才)'
              ],
              signal:[['02:45','醉意深重步伐打滑'],['02:50','突然扶墙停步']], assess:'', ledger:'本轮结算 · 冲突触碰瞬间 · 心跳 +30',
              herAlert:'她 · 错愕回头' },
    prepare:{ player:{heart:30,stamina:100,cash:800,pi:26,proximity:36,date:4,attrs:{str:2,agi:4,nrv:3,int:8,cha:8}}, target:{alertStage:0,warinessStage:'低',shoe:'flats'},
              mode:'prepare', dist:'same', env:'day', slot:'prepare',
              area:'自家据点', place:'出租屋书桌前', weather:'day', weatherName:'白昼晴好', strikeSealed:true, fam:0,
              route:{nodes:['学校正门','老水泥天桥','24h便利店','居民杂物暗巷','老旧单元楼道'],known:[1,1,0,0,0],here:-1},
              exits:['外出打工 (行动点-1)', '黑市/商店购物', '踩点摸排情报'],
              spots:['安全屋休整', '查看战利品柜'],
              sanctuaryAlert:'安全据点，心跳静默中',
              tags:[],
              inventory:[
                { id:'lockpick', name:'开锁工具', type:'tool', slot:'tool', count:1, equipped:false, canEquip:true, canUse:false, desc:'潜入工具：解锁开锁路线，敏捷检定+4', effectsDesc:'开锁路线敏捷+4' },
                { id:'cam_storage', name:'针孔摄像机(存储档)', type:'device', slot:null, count:1, equipped:false, canEquip:false, canUse:false, desc:'数字监控设备：居家日程补全，心事线直达', effectsDesc:'日程补全·心事线直达' },
                { id:'bento', name:'便当', type:'consumable', slot:null, count:2, equipped:false, canEquip:false, canUse:true, desc:'消耗品：三餐额度，使用即恢复体力+20', effectsDesc:'体力+20' }
              ],
              proxLog:[
                '+10 · 假装顺路帮按电梯门 (昨晚)',
                '+5  · 掉落纸巾拾还 (昨晚)',
                '+3  · 同店收银台对视 (今早)',
                '-2  · 跟太近引其侧目拉开距离 (前夜)',
                '+4  · 便利店同买关东煮搭话 (刚才)'
              ],
              signal:[], assess:'', ledger:'准备期 · 行动点 3/3 · 距开窗约 2 小时' },
  };

  /* 开发预览：给 mock 灌一份相册数据（真机由 snapshot.album 提供） */
  (function seedAlbumMock() {
    const shots = [
      { key: 'bottom_jk_pleat_navy|side', file: 'jk/bottom/shared/bottom_jk_pleat_navy/side.png', name: '藏青百褶短裙', slot: 'bottom', angle: 'side', t: 3, place: '居民杂物暗巷', dist: 'close' },
      { key: 'top_jk_blazer|front', file: 'jk/top/long/normal/top_jk_blazer/front.png', name: '藏青西装外套', slot: 'top', angle: 'front', t: 3, place: '居民杂物暗巷', dist: 'close' },
      { key: 'sock_knee_black|side', file: 'jk/socks/shared/sock_knee_black/side.png', name: '黑色及膝袜', slot: 'socks', angle: 'side', t: 2, place: '24h便利店', dist: 'same' },
      { key: 'head_ribbon_navy|back', file: 'jk/head/hair/long/head_ribbon_navy/back.png', name: '藏青发带', slot: 'head', angle: 'back', t: 2, place: '24h便利店', dist: 'same' }
    ];
    const catalog = [
      ...shots.map(s => ({ key: s.key, name: s.name, slot: s.slot, angle: s.angle, file: s.file })),
      { key: 'bottom_jk_pleat_navy|front', name: '藏青百褶短裙', slot: 'bottom', angle: 'front', file: 'jk/bottom/shared/bottom_jk_pleat_navy/front.png' },
      { key: 'bottom_jk_denim|front', name: '水洗牛仔短裙', slot: 'bottom', angle: 'front', file: 'jk/bottom/shared/bottom_jk_denim/front.png' },
      { key: 'top_jk_sailor|side', name: '白底水手服上衣', slot: 'top', angle: 'side', file: 'jk/top/long/normal/top_jk_sailor/side.png' },
      { key: 'sock_cotton_short|front', name: '纯白短棉袜', slot: 'socks', angle: 'front', file: 'jk/socks/shared/sock_cotton_short/front.png' },
      { key: 'shoe_leather|side', name: '制服小皮鞋', slot: 'shoes', angle: 'side', file: 'jk/shoes/shared/shoe_leather/side.png' }
    ];
    MOCKS.sweet.album = { count: shots.length, total: 62, shots, catalog };
    MOCKS.sweet.capture = { key: shots[0].key, file: shots[0].file, name: shots[0].name, angle: 'side', dist: 'close', t: 3, place: '居民杂物暗巷', piBonus: 2 };
  })();


  /* ---------- 仪表盘绘制（刻度 0-100 = 心跳值；甜区 40-65；操作线 70/90 标记） ---------- */
  const dial = document.getElementById('dial');
  const point = (value, radius = 62) => {
    const angle = (135 + value / 100 * 270) * Math.PI / 180;
    return { x: 80 + radius * Math.cos(angle), y: 80 + radius * Math.sin(angle) };
  };
  function arc(from, to) {
    const a = point(from), b = point(to);
    return `M ${a.x} ${a.y} A 62 62 0 ${(to - from) / 100 * 270 > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
  }
  dial.querySelector('.dial-track').setAttribute('d', arc(0, 100));
  dial.querySelector('.dial-sweet').setAttribute('d', arc(SWEET[0], SWEET[1]));
  const NS='http://www.w3.org/2000/svg', gT=dial.querySelector('.dial-ticks');
  for (let value = 0; value <= 100; value += 5) {
    const a = point(value, 69), b = point(value, value % 10 === 0 ? 75 : 72);
    const tick = document.createElementNS(NS, 'line');
    for (const [k,v] of Object.entries({ x1:a.x, y1:a.y, x2:b.x, y2:b.y })) tick.setAttribute(k, v);
    tick.setAttribute('class', 'dial-tick');
    gT.append(tick);
  }
  /* 操作线标记：70 变形（金）、90 崩溃（红） */
  for (const [v, color] of [[LINES[0], '#d6b96a'], [LINES[1], '#e0566a']]) {
    const a = point(v, 62), b = point(v, 76);
    const l = document.createElementNS(NS, 'line');
    for (const [k,v2] of Object.entries({ x1:a.x, y1:a.y, x2:b.x, y2:b.y })) l.setAttribute(k, v2);
    l.setAttribute('class', 'dial-linemark'); l.setAttribute('stroke', color);
    gT.append(l);
  }
  /* 心电波（GLM 原样保留） */
  const clipId = 'ecg-' + (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
  dial.querySelector('.ecg-clip').id = clipId;
  dial.querySelector('.ecg-window').setAttribute('clip-path', `url(#${clipId})`);
  let ecgPath = 'M 0 114';
  for (let start = 0; start < 288; start += 72)
    for (const [x, y] of [[14,114],[18,111],[22,114],[27,114],[30,104],[34,123],[38,110],[43,114],[51,114],[55,111],[60,114],[72,114]]) ecgPath += ` L ${start + x} ${y}`;
  dial.querySelector('.ecg-line').setAttribute('d', ecgPath);

  /* ---------- 心跳音效引擎（数值直驱 + 耳鸣层 + spike；双音量滑条独立可调） ---------- */
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  let audioContext = null, masterGain = null, heartBus = null;
  let audioOn = false, audioPending = false;
  let audioTimer = null, audioRevision = 0, nextBeat = 0, tinnitusOsc = null, tinnitusGain = null;
  const voices = new Set();
  const soundButton = document.getElementById('heartbeat-sound');
  const audioStatus = document.getElementById('audioStatus');
  let currentHeart = 58;
  /* 音量设置（滑条 0-100） */
  const vol = { heart: .8, tinnitus: .25, rain: .5, step: .7 };   // 默认：心跳偏重，冷雨沙沙，脚步适中，耳鸣压低
  let rainSource = null, rainGain = null, rainFilter = null;

  function createRain() {
    if (rainSource || !audioContext) return;
    const sampleRate = audioContext.sampleRate;
    const bufferSize = sampleRate * 2;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }
    rainSource = audioContext.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    rainFilter = audioContext.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.value = 2600;

    rainGain = audioContext.createGain();
    rainGain.gain.value = vol.rain * 0.4;

    rainSource.connect(rainFilter).connect(rainGain).connect(masterGain);
    rainSource.start();
  }

  let currentSnap = null;

  /* 她的警觉：只给档位与五格刻度，不给精确数值（她的状态是天气不是仪表） */
  const ALERT_TIERS = [
    { name: '毫无察觉', range: '0–20', tip: '0–20 · 她完全没觉得这晚有什么不对' },
    { name: '不安', range: '21–40', tip: '21–40 · 她开始留意身后，步频变了' },
    { name: '起疑', range: '41–60', tip: '41–60 · 她放慢脚步、频频侧目，会试着钓你' },
    { name: '确认', range: '61–80', tip: '61–80 · 她确信被跟了，会抄近路或求援' },
    { name: '反应', range: '81+', tip: '81–100 · 她进入应激状态，随时爆发或逃向庇护所' }
  ];
  function alertTierOf(snap) {
    const stage = (snap && snap.target && Number.isFinite(snap.target.alertStage)) ? snap.target.alertStage : 0;
    const idx = Math.min(4, Math.max(0, stage));
    return Object.assign({ idx }, ALERT_TIERS[idx]);
  }
  function getRainState(snap) {
    if (!snap) return { hasRain: false, isStorm: false };
    const w = (snap.weather || '').toLowerCase();
    const wn = snap.weatherName || '';
    const env = (snap.env || '').toLowerCase();
    const tagNames = (snap.tags || []).map(t => t.name);

    const isStorm = w === 'storm' || wn.includes('暴雨') || tagNames.some(n => n.includes('暴雨'));
    const hasRain = isStorm || w === 'rain' || wn.includes('雨') || env.includes('rain') || tagNames.some(n => n.includes('雨') || n === '雨幕' || n === '雨夜掩护');
    return { hasRain, isStorm };
  }

  function updateRainTunnel() {
    if (!rainFilter || !rainGain || !audioContext) return;
    const t = audioContext.currentTime;
    const { hasRain, isStorm } = getRainState(currentSnap);

    if (!hasRain) {
      // 场景/标签无雨：雨声平滑淡出至完全静音（晴夜不胡乱下雨）
      rainGain.gain.setTargetAtTime(0.00001, t, 0.35);
      return;
    }

    const rainIntensity = isStorm ? 1.35 : 1.0;
    const baseCutoff = isStorm ? 3200 : 2600;

    // 生理听觉狭窄（隧道效应）：心跳>70 滤波截止频率降至1100Hz；>90 骤降至420Hz且音量压低，真实呈现被自身心跳重击与耳鸣淹没的压迫感
    if (currentHeart >= 90) {
      rainFilter.frequency.setTargetAtTime(420, t, 0.3);
      rainGain.gain.setTargetAtTime(vol.rain * 0.15 * rainIntensity, t, 0.3);
    } else if (currentHeart >= 70) {
      rainFilter.frequency.setTargetAtTime(1100, t, 0.3);
      rainGain.gain.setTargetAtTime(vol.rain * 0.28 * rainIntensity, t, 0.3);
    } else {
      rainFilter.frequency.setTargetAtTime(baseCutoff, t, 0.4);
      rainGain.gain.setTargetAtTime(vol.rain * 0.4 * rainIntensity, t, 0.4);
    }
  }

  function soundUI(message) {
    document.querySelectorAll('#heartbeat-sound, .audio-btn').forEach(btn => {
      btn.textContent = audioPending ? '取消开启' : audioOn ? '关闭雨夜心跳声' : '开启雨夜心跳声';
      btn.setAttribute('aria-pressed', String(audioOn || audioPending));
    });
    document.querySelectorAll('#audioStatus, .audio-status').forEach(el => {
      el.textContent = message;
    });
    const audioBtnTxt = document.getElementById('audioBtnTxt');
    if (audioBtnTxt) {
      audioBtnTxt.textContent = audioOn ? '声音 (开)' : '声音';
    }
  }

  function updateAudioStatus() {
    if (!audioOn) return soundUI('音效已关闭');
    if (!HUNTER_MODES[currentMode]) {
      soundUI('准备期 · 猎手状态未激活 · 心跳静默（自动待命）');
      return;
    }
    const { hasRain, isStorm } = getRainState(currentSnap);
    if (isStorm) {
      soundUI('暴雨夜心跳声已开启 · 狂风骤雨与心跳实时联动');
    } else if (hasRain) {
      soundUI('雨夜心跳声已开启 · 雨幕掩护与心跳实时联动');
    } else {
      soundUI('心跳声已开启 · 晴夜无雨（环境雨声静音待命）');
    }
  }
  function cancelVoices() { for (const o of voices) { try { o.stop(); } catch {} } voices.clear(); }
  function stopAudio(message = '音效已关闭') {
    ++audioRevision; audioOn = false; audioPending = false;
    clearTimeout(audioTimer); audioTimer = null; cancelVoices();
    if (tinnitusGain) tinnitusGain.gain.setTargetAtTime(0, audioContext.currentTime, .2);
    if (rainSource) { try { rainSource.stop(); rainSource.disconnect(); } catch {} rainSource = null; }
    if (audioContext && audioContext.state !== 'closed') audioContext.suspend().catch(() => {});
    soundUI(message);
  }
  function thump(time, frequency, level) {           // 重音版 + 谐波层：小喇叭靠 2.7 倍频发声，大喇叭靠基频压阵
    const o = audioContext.createOscillator(), g = audioContext.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(frequency, time);
    o.frequency.exponentialRampToValueAtTime(Math.max(frequency * .45, 20), time + .16);
    g.gain.setValueAtTime(.0001, time);
    g.gain.linearRampToValueAtTime(level, time + .012);
    g.gain.exponentialRampToValueAtTime(.0001, time + .24);
    o.connect(g).connect(heartBus);
    voices.add(o); o.onended = () => { voices.delete(o); o.disconnect(); g.disconnect(); };
    o.start(time); o.stop(time + .28);
    const h = audioContext.createOscillator(), hg = audioContext.createGain();
    h.type = 'sine';
    h.frequency.setValueAtTime(frequency * 2.7, time);
    h.frequency.exponentialRampToValueAtTime(frequency * 1.6, time + .1);
    hg.gain.setValueAtTime(.0001, time);
    hg.gain.linearRampToValueAtTime(level * .38, time + .01);
    hg.gain.exponentialRampToValueAtTime(.0001, time + .12);
    h.connect(hg).connect(heartBus);
    voices.add(h); h.onended = () => { voices.delete(h); h.disconnect(); hg.disconnect(); };
    h.start(time); h.stop(time + .16);
  }
  function tinnitus() {                              // 心跳>88 渐入的耳鸣层（音量走独立滑条）
    if (!tinnitusOsc) {
      tinnitusOsc = audioContext.createOscillator(); tinnitusOsc.frequency.value = 7500; tinnitusOsc.type = 'sine';
      tinnitusGain = audioContext.createGain(); tinnitusGain.gain.value = 0;
      tinnitusOsc.connect(tinnitusGain).connect(masterGain); tinnitusOsc.start();
    }
    const base = .025 * vol.tinnitus;
    const g = currentHeart > 88 ? Math.min((currentHeart - 88) / 12, 1) * base : 0;
    tinnitusGain.gain.setTargetAtTime(g, audioContext.currentTime, .4);
  }

  /* 拟音层 1：机械单反抓拍快门声（打开档案取景器时触发） */
  function playShutterSound() {
    if (!audioContext || audioContext.state !== 'running') return;
    const t = audioContext.currentTime;
    // 1. 反光板升起 (轻低微撞击)
    const osc = audioContext.createOscillator(), g1 = audioContext.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.025);
    g1.gain.setValueAtTime(0.001, t);
    g1.gain.linearRampToValueAtTime(0.2, t + 0.003);
    g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.028);
    osc.connect(g1).connect(masterGain);
    osc.start(t); osc.stop(t + 0.032);

    // 2. 快门帘幕运动（白噪声切片）
    const buf = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * 0.04), audioContext.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.35));
    const src = audioContext.createBufferSource();
    src.buffer = buf;
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2400;
    filter.Q.value = 2.5;
    const g2 = audioContext.createGain();
    g2.gain.setValueAtTime(0.25, t + 0.012);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(filter).connect(g2).connect(masterGain);
    src.start(t + 0.012);

    // 3. 帘幕闭合回弹微震
    const osc2 = audioContext.createOscillator(), g3 = audioContext.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(220, t + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(80, t + 0.065);
    g3.gain.setValueAtTime(0.09, t + 0.04);
    g3.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    osc2.connect(g3).connect(masterGain);
    osc2.start(t + 0.04); osc2.stop(t + 0.075);
  }

  /* 真实音频直链映射表（双模：本地/静态资源优先，加载失败时无缝由 WebAudio 拟音兜底） */
  const SHOE_AUDIO_FILES = {
    heel: 'work/audio_assets/heels.mp3',
    flats: 'work/audio_assets/flats.mp3',
    leather: 'work/audio_assets/leather_shoes.mp3',
    boots: 'work/audio_assets/boots.mp3',
    platform: 'work/audio_assets/platform.mp3',
    sandals: 'work/audio_assets/sandals.mp3',
    slippers: 'work/audio_assets/slippers.mp3',
    sneakers: 'work/audio_assets/sneakers.mp3',
    barefoot: 'work/audio_assets/barefoot.mp3'
  };

  const ENV_SFX_FILES = {
    cat: 'work/audio_assets/cat_meow.ogg',
    dog: 'work/audio_assets/dog_bark.ogg'
  };

  function playEnvAudio(sfxKey) {
    if (!audioOn) return;
    const url = ENV_SFX_FILES[sfxKey];
    if (url) {
      try {
        const a = new Audio(url);
        a.volume = Math.min(1, Math.max(0.1, (vol.heart || 0.8) * 0.9));
        const p = a.play();
        if (p && p.then) {
          p.catch(() => { synthProceduralEnv(sfxKey); });
        }
      } catch { synthProceduralEnv(sfxKey); }
    } else {
      synthProceduralEnv(sfxKey);
    }
  }

  function synthProceduralEnv(sfxKey) {
    if (!audioContext || audioContext.state !== 'running') return;
    const t = audioContext.currentTime;
    if (sfxKey === 'cat') {
      const o = audioContext.createOscillator(), g = audioContext.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(1100, t);
      o.frequency.exponentialRampToValueAtTime(1350, t + 0.12);
      o.frequency.exponentialRampToValueAtTime(650, t + 0.45);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      o.connect(g).connect(masterGain);
      o.start(t); o.stop(t + 0.46);
    } else if (sfxKey === 'dog') {
      for (let i = 0; i < 2; i++) {
        const dt = t + i * 0.22;
        const o = audioContext.createOscillator(), g = audioContext.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(220, dt);
        o.frequency.exponentialRampToValueAtTime(85, dt + 0.12);
        g.gain.setValueAtTime(0.14, dt);
        g.gain.exponentialRampToValueAtTime(0.001, dt + 0.14);
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 450;
        o.connect(filter).connect(g).connect(masterGain);
        o.start(dt); o.stop(dt + 0.15);
      }
    }
  }

  /* 拟音层 2：目标鞋型踏步声（真实采样优先 + WebAudio 物理双触点兜底）
     响度 = 脚步滑杆 × 距离折算声级（0~5）：越近越响，静音级不播；她已到家（走完动线）也不再播 */
  function playFootstepSound(shoeOverride) {
    if (!audioContext || audioContext.state !== 'running') return;
    const snap = currentSnap;
    const shoe = shoeOverride || (snap && snap.target && snap.target.shoe) || 'heel';
    const info = snap && snap.target && snap.target.shoeInfo;
    const level = info && typeof info.level === 'number' ? Math.max(0, Math.min(5, info.level)) : 3;
    const route = snap && snap.route;
    const atEnd = !!(route && Array.isArray(route.nodes) && route.here >= route.nodes.length - 1);
    if (level <= 0 || atEnd) return;   // 静音鞋 / 她已停下：这一步不响
    const distVol = Math.max(0.12, level / 5);   // 1 级也有细响，避免整段没声
    const t = audioContext.currentTime;
    const { hasRain } = getRainState(currentSnap);

    const audioUrl = SHOE_AUDIO_FILES[shoe];
    if (audioUrl) {
      try {
        const a = new Audio(audioUrl);
        a.volume = Math.min(1, Math.max(0.05, (vol.step || 0.7) * distVol));
        const p = a.play();
        if (p && p.then) {
          p.catch(() => { synthProceduralFootstep(shoe, t); });
        }
      } catch {
        synthProceduralFootstep(shoe, t);
      }
    } else {
      synthProceduralFootstep(shoe, t);
    }

    if (hasRain) {
      const buf = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * 0.045), audioContext.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.25));
      const src = audioContext.createBufferSource();
      src.buffer = buf;
      const filter = audioContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3200;
      const gSplash = audioContext.createGain();
      gSplash.gain.setValueAtTime(0.08, t + 0.005);
      gSplash.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
      src.connect(filter).connect(gSplash).connect(masterGain);
      src.start(t + 0.005);
    }
  }

  function synthProceduralFootstep(shoe, t) {
    if (!audioContext || audioContext.state !== 'running') return;
    if (shoe === 'heel') {
      const oscPin = audioContext.createOscillator(), gPin = audioContext.createGain();
      oscPin.type = 'triangle';
      oscPin.frequency.setValueAtTime(1900, t);
      oscPin.frequency.exponentialRampToValueAtTime(450, t + 0.025);
      gPin.gain.setValueAtTime(0.18, t);
      gPin.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      oscPin.connect(gPin).connect(masterGain);
      oscPin.start(t); oscPin.stop(t + 0.035);

      const oscSole = audioContext.createOscillator(), gSole = audioContext.createGain();
      oscSole.type = 'sine';
      oscSole.frequency.setValueAtTime(110, t + 0.015);
      oscSole.frequency.exponentialRampToValueAtTime(40, t + 0.055);
      gSole.gain.setValueAtTime(0.1, t + 0.015);
      gSole.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      oscSole.connect(gSole).connect(masterGain);
      oscSole.start(t + 0.015); oscSole.stop(t + 0.065);
    } else if (shoe === 'boots') {
      const osc = audioContext.createOscillator(), g = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(70, t);
      osc.frequency.exponentialRampToValueAtTime(26, t + 0.085);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(g).connect(masterGain);
      osc.start(t); osc.stop(t + 0.095);
    } else if (shoe === 'platform') {
      const osc = audioContext.createOscillator(), g = audioContext.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.07);
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
      osc.connect(g).connect(masterGain);
      osc.start(t); osc.stop(t + 0.08);
    } else if (shoe === 'leather') {
      const osc = audioContext.createOscillator(), g = audioContext.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750, t);
      osc.frequency.exponentialRampToValueAtTime(95, t + 0.04);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
      osc.connect(g).connect(masterGain);
      osc.start(t); osc.stop(t + 0.05);
    } else if (shoe === 'sneakers') {
      const osc = audioContext.createOscillator(), g = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.045);
      g.gain.setValueAtTime(0.09, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(g).connect(masterGain);
      osc.start(t); osc.stop(t + 0.055);
    } else if (shoe === 'barefoot') {
      const osc = audioContext.createOscillator(), g = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.05);
      g.gain.setValueAtTime(0.11, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
      osc.connect(g).connect(masterGain);
      osc.start(t); osc.stop(t + 0.06);
    } else if (shoe === 'slippers') {
      const o1 = audioContext.createOscillator(), g1 = audioContext.createGain();
      o1.type = 'triangle';
      o1.frequency.setValueAtTime(280, t);
      o1.frequency.exponentialRampToValueAtTime(60, t + 0.03);
      g1.gain.setValueAtTime(0.12, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      o1.connect(g1).connect(masterGain);
      o1.start(t); o1.stop(t + 0.04);
    } else if (shoe === 'sandals') {
      const o1 = audioContext.createOscillator(), g1 = audioContext.createGain();
      o1.type = 'triangle';
      o1.frequency.setValueAtTime(1100, t);
      o1.frequency.exponentialRampToValueAtTime(220, t + 0.02);
      g1.gain.setValueAtTime(0.11, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      o1.connect(g1).connect(masterGain);
      o1.start(t); o1.stop(t + 0.03);
    } else {
      const osc = audioContext.createOscillator(), g = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.05);
      g.gain.setValueAtTime(0.11, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
      osc.connect(g).connect(masterGain);
      osc.start(t); osc.stop(t + 0.06);
    }
  }
  /* 猎手状态门禁：心跳声只在尾行/潜伏/伪装接触/终局激活，准备期与熟络社交静默 */
  const HUNTER_MODES = { stealth: 1, contact: 1, vehicle: 1 };
  let currentMode = 'stealth';
  function scheduleAudio() {
    if (!audioOn || audioContext.state !== 'running') return;
    if (!HUNTER_MODES[currentMode]) { audioTimer = setTimeout(scheduleAudio, 300); return; }   // 待命：切回猎手模式自动恢复
    const period = 60 / heartToBpm(currentHeart);
    const freq = heartFreq(currentHeart);
    const volLevel = (.55 + (currentHeart / 100) * .45) * vol.heart;   // 基础翻倍：满值贴 1.0
    const now = audioContext.currentTime;
    if (nextBeat < now - .12) nextBeat = now + .04;
    while (nextBeat < now + .12) {
      thump(nextBeat, freq, volLevel);
      thump(nextBeat + Math.min(.16, period * .22), freq * .9, volLevel * .8);
      nextBeat += period;
    }
    audioTimer = setTimeout(scheduleAudio, 25);
    tinnitus();
  }
  function syncAudioTempo() {
    if (!audioOn) return;
    clearTimeout(audioTimer); cancelVoices();
    nextBeat = audioContext.currentTime + .04;
    scheduleAudio();
    const periodMs = 60000 / heartToBpm(currentHeart);
    for (const animation of root.getAnimations({ subtree: true })) {
      const phase = animation.animationName === 'ecg-scroll' ? 22 / 72 : .12;
      if (['ecg-scroll', 'beat', 'ring-beat'].includes(animation.animationName)) animation.currentTime = phase * periodMs - 40;
    }
  }
  async function toggleAudio() {
    if (audioOn || audioPending) return stopAudio();
    if (!AudioCtor) return soundUI('当前浏览器不支持心跳音效');
    if (document.hidden) return soundUI('回到页面后点击开启心跳声');
    const revision = ++audioRevision;
    audioPending = true; soundUI('正在开启心跳声…');
    try {
      if (!audioContext || audioContext.state === 'closed') {
        audioContext = new AudioCtor();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 1;
        masterGain.connect(audioContext.destination);
        heartBus = audioContext.createGain();
        heartBus.gain.value = 1;
        heartBus.connect(masterGain);
        audioContext.addEventListener('statechange', () => {
          if (audioOn && audioContext.state !== 'running') stopAudio('播放已暂停，点击可重新开启');
        });
      }
      await audioContext.resume();
      if (revision !== audioRevision || !root.isConnected || document.hidden) return;
      if (audioContext.state !== 'running') throw new Error('no resume');
      audioPending = false; audioOn = true;
      createRain();
      updateRainTunnel();
      syncAudioTempo();
      updateAudioStatus();
    } catch { if (revision === audioRevision) stopAudio('未能播放，点击可重试；也可保持静音'); }
  }
  if (!AudioCtor) { soundButton.disabled = true; soundUI('当前浏览器不支持心跳音效'); }
  /* 结算 spike：+8 刺激的重拍（真机由中控结算回执触发） */
  function spike() {
    if (!audioOn) return soundUI('先开启雨夜心跳声，再试 spike');
    const t = audioContext.currentTime, v = (.55 + (currentHeart / 100) * .45) * vol.heart;
    thump(t, 38, Math.max(v, .5) * 1.9);
    thump(t + .15, 36, Math.max(v, .5) * 1.5);
    const vig = document.getElementById('trpgVignette');
    if (vig) {
      vig.classList.remove('pulse');
      void vig.offsetWidth;
      vig.classList.add('pulse');
    }
    const next = currentHeart + 8 >= 100 ? 100 : currentHeart + 8;
    renderSnapshot({ ...MOCKS[document.querySelector('[data-preset][aria-pressed="true"]')?.dataset.preset || 'sweet'],
      player: { heart: next, stamina: 72, cash: 240, pi: 18, proximity: 36, date: 3, attrs: { str: 2, agi: 4, nrv: 3, int: 8, cha: 8 } } });
  }
  /* 三音量滑条联动 */
  function applyVolumes() {
    if (heartBus) heartBus.gain.setTargetAtTime(vol.heart, audioContext.currentTime, .05);
    if (audioOn) {
      tinnitus();
      updateRainTunnel();
    }
  }

  /* 战术行囊持有物字典与渲染器 */
  const ITEM_TYPE_NAMES = {
    tool: '潜入工具',
    tech: '科技门票',
    device: '数字设备',
    disguise: '伪装道具',
    consumable: '消耗补给',
    trophy: '纪念物',
    gear: '便携配件',
    misc: '杂项物品'
  };
  const ITEM_TYPE_ICONS = {
    tool: 'tool',
    tech: 'tech',
    device: 'device',
    disguise: 'mask',
    consumable: 'bolt',
    trophy: 'cup',
    gear: 'bag',
    misc: 'box'
  };

  /* ═══ M4-2 行动胶囊体系（情境自适应 4 胶囊 + 姿态指示 + 二级抽屉展开） ═══ */
  let currentCapsuleActions = [];
  let postureEnabled = true;              // 默认姿态：未点选胶囊时以「跟缀·保持当前距离」结算
  let defaultPosture = { id: 'follow', name: '跟缀', args: { dist: 'same' } };
  let currentDynamicCapsules = [];

  const DRAWER_CATEGORIES = [
    {
      name: '潜行与身法',
      modes: ['stealth', 'any'],
      actions: [
        { id: 'follow', name: '跟缀', args: { dist: 'same' } },
        { id: 'follow', name: '贴近', args: { dist: 'close' } },
        { id: 'withdraw', name: '拉开距离', args: { dist: 'far' } },
        { id: 'hide', name: '躲藏', args: {} },
        { id: 'breath', name: '缓息', args: {} },
        { id: 'gait', name: '变换步态', args: {} },
        { id: 'hide', name: '贴墙', args: {} },
        { id: 'hide', name: '借物掩护', args: {} },
      ]
    },
    {
      name: '侦查与取证',
      modes: ['stealth', 'any', 'contact'],
      actions: [
        { id: 'photo', name: '拍照', args: {} },
        { id: 'record', name: '录音', args: {} },
        { id: 'door_listen', name: '贴身听', args: {} },
        { id: 'timing', name: '读时机', args: {} },
        { id: 'scan', name: '打量', args: {} },
        { id: 'door_peep', name: '门缝观察', args: {} },
        { id: 'scan', name: '橱窗反射', args: {} },
      ]
    },
    {
      name: '破门与入室',
      modes: ['stealth', 'any'],
      actions: [
        { id: 'try_handle', name: '试门把', args: {} },
        { id: 'lockpick', name: '开锁', args: {} },
        { id: 'pry', name: '撬门', args: {} },
        { id: 'check_door', name: '查门禁', args: {} },
        { id: 'climb', name: '翻墙', args: {} },
        { id: 'ransack', name: '翻找', args: {} },
        { id: 'plan_exit', name: '撤离', args: {} },
      ]
    },
    {
      name: '接触与脱罪',
      modes: ['contact', 'any'],
      actions: [
        { id: 'chat', name: '搭话', args: {} },
        { id: 'greet', name: '寒暄', args: {} },
        { id: 'answer_guard', name: '应对盘问', args: {} },
        { id: 'misdirection', name: '误导归因', args: {} },
        { id: 'bribe', name: '买通', args: {} },
        { id: 'shop_enter', name: '佯装进店', args: {} },
        { id: 'abort', name: '借故告退', args: {} },
      ]
    },
    {
      name: '终局与冲突',
      modes: ['climax', 'any', 'stealth'],
      actions: [
        { id: 'strike', name: '下手 (偷袭)', args: { style: 'ambush' }, danger: true },
        { id: 'strike', name: '下手 (强攻)', args: { style: 'assault' }, danger: true },
        { id: 'pin', name: '按制', args: {} },
        { id: 'chase', name: '追逐', args: {} },
      ]
    }
  ];

  /* ═══ 胶囊条件门槛（主人 2026-10-19 定） ═══
     场景不相干的动作直接不出现（街上没有门，就别给开锁）；
     场景相干但条件不足的留成灰条并写明缺什么（非贴身不给偷袭、没开锁工具不给开锁）。
     引擎侧有同一套 requires 兜底，UI 只负责别让人误点。 */
  function capsuleGate(c, snap) {
    const distLabel = { far: '远端', same: '同街', close: '身后', touch: '贴身' };
    const dist = (snap && snap.dist) || 'same';
    const place = String((snap && snap.place) || '');
    const isDoor = /单元|楼道|门|玄关|电梯|台阶|入口|unit|stairs|gate|door|porch|lobby|entrance/i.test(place);
    const near = dist === 'close' || dist === 'touch';
    const inv = (snap && snap.inventory) || [];
    const has = (ids) => inv.some(it => ids.includes(it.id) && (it.count || 1) > 0);
    const style = c && c.args && c.args.style;

    // 破门类：没有门 → 整条不出现；有门但人还在十几米外 → 灰条（够不着）
    if (['lockpick', 'pry', 'try_handle', 'door_listen', 'door_peep', 'check_door'].includes(c.id)) {
      if (!isDoor) return { hide: true, lock: false, reason: '此处没有门' };
      if (!near) return { hide: false, lock: true, reason: `需走近门前（当前 ${distLabel[dist] || dist}）` };
    }
    // 手上的活：翻找 / 翻墙，人也得先到位
    if ((c.id === 'ransack' || c.id === 'climb') && !near) {
      return { hide: false, lock: true, reason: `需走到近旁才做得成（当前 ${distLabel[dist] || dist}）` };
    }
    // 跟缀＝保持当前距离继续跟，不是「挪到某个距离」，所以不吃距离变更门槛
    const isMaintain = c.id === 'follow' && /跟缀|保持|维持/.test(String(c.name || ''));
    // 距离类：已经贴身就别再「逼近」，已经最远就别再「拉开」；同一档也别让人白点一次
    if (c.args && c.args.dist && !isMaintain) {
      const R = { far: 0, same: 1, close: 2, touch: 3 };
      const cur = R[dist], tgt = R[c.args.dist];
      if (tgt !== undefined) {
        const name = String(c.name || '');
        const isCloser = /贴身|逼近|压近|贴近|靠近/.test(name);
        const isFarther = /拉开|退回|后撤|拉远/.test(name);
        if (isCloser && tgt <= cur) {
          return { hide: false, lock: true, reason: cur === 3 ? '已贴身，无法再靠近' : `已在${distLabel[dist] || dist}，不必再逼近` };
        }
        if (isFarther && tgt >= cur) {
          return { hide: false, lock: true, reason: cur === 0 ? '已是最远，无法再退' : `已在${distLabel[dist] || dist}，不必再拉开` };
        }
        if (!isCloser && !isFarther && tgt === cur) {
          return { hide: false, lock: true, reason: `已在${distLabel[dist] || dist}` };
        }
      }
    }
    // 贴身时无处可躲；按制只在贴身成立；心跳已在低位时缓息无效
    if (c.id === 'hide' && dist === 'touch') return { hide: false, lock: true, reason: '贴身时无处可躲（先拉开距离）' };
    if (c.id === 'pin' && dist !== 'touch') return { hide: false, lock: true, reason: '需贴身才能按制' };
    if (c.id === 'breath' && snap && snap.player && Number(snap.player.heart) <= 20) {
      return { hide: false, lock: true, reason: '心跳已在低位，缓息无效' };
    }
    if (c.id === 'lockpick' && !has(['lockpick', 'cyber_lockpick'])) {
      return { hide: false, lock: true, reason: '缺少开锁工具（终端·战术行囊可购买并装备）' };
    }
    if (c.id === 'strike') {
      const need = style === 'assault' ? ['close', 'touch'] : ['touch'];
      if (!need.includes(dist)) {
        return { hide: false, lock: true, reason: (style === 'assault' ? '需身后或贴身才能强攻' : '需贴身（1 米内）才能偷袭') + `（当前 ${distLabel[dist] || dist}）` };
      }
    }
    return { hide: false, lock: false, reason: '' };
  }

  function getDynamicCapsules(snap) {
    const mode = (snap && snap.mode) || 'stealth';
    const dist = (snap && snap.dist) || 'same';
    const pId = String((snap && snap.place) || '').toLowerCase();
    const isDoor = pId.includes('unit') || pId.includes('stairs') || pId.includes('gate') || pId.includes('door');
    const isRoom = pId.includes('residence') || pId.includes('room');

    if (mode === 'stealth') {
      if (isDoor) {
        return {
          default: null,
          chips: [
            { id: 'try_handle', name: '试门把', args: {}, tip: '赌运气，零声浪无痕迹' },
            { id: 'lockpick', name: '挠钩开锁', args: {}, tip: '技术慢工，吃敏捷检定' },
            { id: 'pry', name: '暴力撬门', args: {}, tip: '快速强攻，留痕且声浪大' },
            { id: 'door_listen', name: '贴门听动静', args: {}, tip: '听取门内声浪与活动' },
          ]
        };
      }
      if (isRoom) {
        return {
          default: { id: 'ransack', name: '翻找', args: {} },
          chips: [
            { id: 'ransack', name: '细致翻找', args: {}, tip: '搜寻衣柜/书桌/贴身物' },
            { id: 'door_listen', name: '听门外动静', args: {}, tip: '警戒走廊脚步' },
            { id: 'door_peep', name: '观察窗外', args: {}, tip: '确认撤离路线' },
            { id: 'plan_exit', name: '悄声撤离', args: {}, tip: '原路脱身离开' },
          ]
        };
      }
      if (dist === 'far') {
        return {
          default: { id: 'follow', name: '跟缀', args: { dist: 'far' } },
          chips: [
            { id: 'follow', name: '压近 (同街)', args: { dist: 'same' }, tip: '加快步速缩短到同街' },
            { id: 'photo', name: '长焦拍照', args: {}, tip: '远距离取证抓拍' },
            { id: 'hide', name: '借掩体躲藏', args: {}, tip: '避入路灯死角或行道树' },
            { id: 'breath', name: '缓息平复', args: {}, tip: '放缓呼吸，平复心跳' },
          ]
        };
      }
      if (dist === 'close') {
        return {
          default: { id: 'follow', name: '跟缀', args: { dist: 'close' } },
          chips: [
            { id: 'follow', name: '贴身逼近', args: { dist: 'touch' }, tip: '压缩至一步之内' },
            { id: 'door_listen', name: '贴身听/录音', args: {}, tip: '监听私密电话或脚步' },
            { id: 'withdraw', name: '退回同街', args: { dist: 'same' }, tip: '放慢步子退回安全距离' },
            { id: 'strike', name: '下手 (偷袭)', args: { style: 'ambush' }, danger: true, tip: '贴身偷袭捂嘴压制' },
          ]
        };
      }
      if (dist === 'touch') {
        return {
          default: { id: 'follow', name: '跟缀', args: { dist: 'touch' } },
          chips: [
            { id: 'strike', name: '下手 (偷袭)', args: { style: 'ambush' }, danger: true, tip: '贴身偷袭捂嘴压制' },
            { id: 'door_listen', name: '贴身听', args: {}, tip: '极近距离侦听' },
            { id: 'ransack', name: '顺手牵羊', args: {}, tip: '顺走包袋贴身物件' },
            { id: 'withdraw', name: '稍稍拉开', args: { dist: 'close' }, tip: '退回身后十步' },
          ]
        };
      }
      // 默认 same
      return {
        default: { id: 'follow', name: '跟缀', args: { dist: 'same' } },
        chips: [
          { id: 'follow', name: '逼近 (身后)', args: { dist: 'close' }, tip: '压近到她身后10步' },
          { id: 'withdraw', name: '拉开 (远端)', args: { dist: 'far' }, tip: '放慢步速拉开到对街' },
          { id: 'hide', name: '借掩体躲藏', args: {}, tip: '借路边阴影或建筑躲藏' },
          { id: 'photo', name: '拍照取证', args: {}, tip: '拿出手机抓拍' },
        ]
      };
    }
    if (mode === 'contact') {
      return {
        default: null,
        chips: [
          { id: 'chat', name: '搭话搭讪', args: {}, tip: '借故上前展开对话' },
          { id: 'greet', name: '礼貌寒暄', args: {}, tip: '低风险日常打招呼' },
          { id: 'misdirection', name: '误导归因', args: {}, tip: '将可疑动静归咎于野猫风声' },
          { id: 'abort', name: '借故告退', args: {}, tip: '结束交谈回到潜行' },
        ]
      };
    }
    if (mode === 'climax') {
      return {
        default: null,
        chips: [
          { id: 'strike', name: '下手 (偷袭)', args: { style: 'ambush' }, danger: true, tip: '暗中偷袭' },
          { id: 'strike', name: '下手 (强攻)', args: { style: 'assault' }, danger: true, tip: '正面直接强攻' },
          { id: 'pin', name: '维持按制', args: {}, tip: '压制控制' },
          { id: 'chase', name: '全力追逐', args: {}, tip: '破颜追逐' },
        ]
      };
    }
    return {
      default: null,
      chips: [
        { id: 'breath', name: '缓息', args: {}, tip: '平复心跳' },
        { id: 'photo', name: '拍照', args: {}, tip: '抓拍' },
      ]
    };
  }

  function updateInputPlaceholder() {
    const topDoc = (typeof window !== 'undefined' && window.parent && window.parent !== window)
      ? window.parent.document
      : document;
    const inputEl = topDoc.querySelector('#send_textarea') || topDoc.querySelector('#send_form textarea');
    if (!inputEl) return;

    if (currentCapsuleActions.length) {
      const act = currentCapsuleActions[0];
      if (['lockpick', 'pry', 'try_handle'].includes(act.id)) {
        inputEl.placeholder = `描述你的动作与尝试细节（已选：${act.name}，如：拿出工具探入锁孔...）`;
      } else if (act.id === 'strike') {
        inputEl.placeholder = `描述你的扑袭与动作举止（已选：${act.name}，如：借转角视线死角...）`;
      } else if (act.id === 'misdirection') {
        inputEl.placeholder = `描述你的说辞与借口（已选：${act.name}，如：把动静推给野猫...）`;
      } else {
        inputEl.placeholder = `描述正文（已选定行动：${act.name}）...`;
      }
    } else if (postureEnabled && defaultPosture) {
      inputEl.placeholder = '输入正文（默认姿态：跟缀·保持当前距离）...';
    } else {
      inputEl.placeholder = '输入正文（纯叙事，不掷骰）...';
    }
  }

  function renderActionChipsUI() {
    const wrap = document.getElementById('wxChipsWrap');
    if (!wrap) return;
    const chips = (currentDynamicCapsules || [])
      .map(c => ({ c, gate: capsuleGate(c, currentSnap) }))
      .filter(x => !x.gate.hide);
    wrap.innerHTML = chips.map(({ c, gate }) => {
      const isAct = currentCapsuleActions.some(a => a.id === c.id && JSON.stringify(a.args || {}) === JSON.stringify(c.args || {}));
      const cls = ['wx-capsule-chip', isAct ? 'active' : '', c.danger ? 'danger' : '', gate.lock ? 'locked' : ''].filter(Boolean).join(' ');
      const tip = gate.lock ? gate.reason : (c.tip || c.name);
      return `<button type="button" class="${cls}" data-action-id="${c.id}" data-action-name="${c.name}" data-action-args='${JSON.stringify(c.args || {})}' data-tip="${tip}"${gate.lock ? ' aria-disabled="true"' : ''}>${isAct ? '<span class="chip-check">✓</span> ' : ''}${c.name}</button>`;
    }).join('');

    const badge = document.getElementById('wxPostureBadge');
    if (badge) {
      if (currentCapsuleActions.length) {
        const act = currentCapsuleActions[0];
        badge.className = 'wx-posture-badge';
        badge.textContent = `已选: ${act.name}`;
        badge.setAttribute('data-tip', `本轮已选动作：${act.name}。点胶囊可更换或取消；取消后回到默认姿态。`);
      } else if (postureEnabled && defaultPosture) {
        badge.className = 'wx-posture-badge';
        badge.textContent = '默认: 跟缀 · 保持距离';
        badge.setAttribute('data-tip', '未点选胶囊时，本轮以「跟缀·保持当前距离」继续跟踪。点击切换为纯叙事（不掷骰）。');
      } else {
        badge.className = 'wx-posture-badge narrative';
        badge.textContent = '未选动作 · 纯叙事';
        badge.setAttribute('data-tip', '本轮没有动作：输入框文本只作伴随叙事，不触发任何检定。点击恢复默认跟缀姿态。');
      }
    }
  }

  function renderActionDrawer(snap) {
    const bodyEl = document.getElementById('wxActionDrawerBody');
    if (!bodyEl) return;
    const mode = (snap && snap.mode) || 'stealth';
    const validGroups = DRAWER_CATEGORIES.filter(cat => cat.modes.includes(mode) || cat.modes.includes('any'));

    bodyEl.innerHTML = validGroups.map(cat => {
      const visible = cat.actions
        // 「跟缀」是保持距离，不是换距离：把它绑到当前档，别让它把人往回拽
        .map(act => (act.id === 'follow' && /跟缀|保持|维持/.test(act.name))
          ? { ...act, args: { ...(act.args || {}), dist: (snap && snap.dist) || 'same' } }
          : act)
        .map(act => ({ act, gate: capsuleGate(act, snap) }))
        .filter(x => !x.gate.hide);
      if (!visible.length) return '';
      const chipsHtml = visible.map(({ act, gate }) => {
        const isAct = currentCapsuleActions.some(a => a.id === act.id && JSON.stringify(a.args || {}) === JSON.stringify(act.args || {}));
        const cls = ['wx-capsule-chip', isAct ? 'active' : '', act.danger ? 'danger' : '', gate.lock ? 'locked' : ''].filter(Boolean).join(' ');
        const tip = gate.lock ? gate.reason : act.name;
        return `<button type="button" class="${cls}" data-action-id="${act.id}" data-action-name="${act.name}" data-action-args='${JSON.stringify(act.args || {})}' data-tip="${tip}"${gate.lock ? ' aria-disabled="true"' : ''}>${isAct ? '<span class="chip-check">✓</span> ' : ''}${act.name}</button>`;
      }).join('');
      return `<div class="drawer-group">
        <div class="drawer-group-title">${cat.name}</div>
        <div class="drawer-group-chips">${chipsHtml}</div>
      </div>`;
    }).join('');
  }

  function renderActionCapsules(snap) {
    const plan = getDynamicCapsules(snap);
    defaultPosture = plan.default || { id: 'follow', name: '跟缀', args: { dist: (snap && snap.dist) || 'same' } };
    currentDynamicCapsules = plan.chips;
    renderActionChipsUI();
    updateInputPlaceholder();
    renderActionDrawer(snap);
  }

  function renderInventory(snap) {
    const listEl = document.getElementById('wx-items');
    if (!listEl) return;
    const inv = (snap && snap.inventory) || [];
    if (!inv.length) {
      listEl.innerHTML = '<li class="wx-item-empty"><span class="label">（战术行囊暂无物品）</span></li>';
      return;
    }
    listEl.innerHTML = inv.map(it => {
      const typeName = ITEM_TYPE_NAMES[it.type] || '道具';
      const typeIcon = ico(ITEM_TYPE_ICONS[it.type] || 'box');
      const slotText = it.slot ? ` · 槽位: ${it.slot}` : '';
      const effectText = it.effectsDesc ? `${it.effectsDesc}\n` : '';
      const tip = `【${it.name}】${effectText}· 类型：${typeName}${slotText}\n· 详情：${it.desc || '行囊装备'}`;

      let actionBtn = '';
      if (it.canEquip) {
        if (it.equipped) {
          actionBtn = `<button type="button" class="wx-item-btn btn-unequip" data-item-action="unequip" data-item-id="${it.id}">卸下</button>`;
        } else {
          actionBtn = `<button type="button" class="wx-item-btn btn-equip" data-item-action="equip" data-item-id="${it.id}">装备</button>`;
        }
      } else if (it.canUse) {
        actionBtn = `<button type="button" class="wx-item-btn btn-use" data-item-action="use" data-item-id="${it.id}">使用</button>`;
      } else {
        actionBtn = `<button type="button" class="wx-item-btn" data-wx-item="${it.id}">说明</button>`;
      }

      return `<li class="wx-item-row" data-tip="${tip}">
        <div class="wx-item-left">
          <span class="wx-item-type-badge">${typeIcon} ${typeName}</span>
          <span class="wx-item-name">${it.name}</span>
          ${it.count > 1 ? `<span class="wx-item-count">×${it.count}</span>` : ''}
          ${it.equipped ? '<span class="wx-item-equipped-pill">已装备</span>' : ''}
        </div>
        <div class="wx-item-right">
          ${actionBtn}
        </div>
      </li>`;
    }).join('');
  }

  /* ---------- 相册：贴墙渲染 + 拍照即时卡片 ---------- */
  const IMG_BASE = 'user/images/wx_wardrobe/';
  const SLOT_CN = { head: '头饰', top: '上装', bottom: '下装', socks: '袜子', shoes: '鞋子' };
  const SLOT_ORDER = ['head', 'top', 'bottom', 'socks', 'shoes'];
  const ANGLE_CN = { front: '正面', side: '侧面', back: '背面', 'three-quarter': '斜侧' };
  const DIST_CN_UI = { far: '远端', same: '同街', close: '身后', touch: '贴身' };
  const imgUrl = (file, thumb) => IMG_BASE + (thumb ? String(file).replace(/\.png$/, '.jpg') : file);

  let albumSnap = null;
  let toastTimer = null, lastToastKey = null;

  function renderAlbum(snap) {
    if (!snap || !snap.album) return;
    albumSnap = snap;
    const wall = document.getElementById('albumWall');
    const cnt = document.getElementById('albumCount');
    if (cnt) cnt.textContent = `${snap.album.count} / ${snap.album.total}`;
    if (!wall) return;
    const shots = new Map((snap.album.shots || []).map(s => [s.key, s]));
    wall.innerHTML = SLOT_ORDER.map(slot => {
      const cells = (snap.album.catalog || []).filter(c => c.slot === slot).map(c => {
        const s = shots.get(c.key);
        if (!s) return '<div class="photo empty"></div>';
        return `<div class="photo" data-key="${c.key}"><img loading="lazy" src="${imgUrl(s.file, true)}" alt="" onerror="this.closest('.photo').classList.add('broken')"><span class="cap">${s.name}</span></div>`;
      }).join('');
      return `<div class="wall-sec" data-cn="${SLOT_CN[slot] || slot}">${cells}</div>`;
    }).join('');
  }

  function openAlbum() {
    const d = document.getElementById('wx-album-dialog');
    if (!d) return;
    renderAlbum(albumSnap || currentSnap);
    if (!d.open) d.showModal();
  }

  function openPhoto(key) {
    const snap = albumSnap || currentSnap;
    const s = snap && snap.album ? (snap.album.shots || []).find(x => x.key === key) : null;
    if (!s) return;
    const det = document.getElementById('albumDetail');
    const img = document.getElementById('albumDetailImg');
    const meta = document.getElementById('albumDetailMeta');
    if (img) img.src = imgUrl(s.file, false);
    if (meta) meta.textContent = `${s.name} · ${ANGLE_CN[s.angle] || s.angle} · 第 ${s.t} 楼 · ${s.place || ''} · ${DIST_CN_UI[s.dist] || ''}`;
    if (det) det.hidden = false;
  }

  function showPhotoToast(snap) {
    const cap = snap && snap.capture;
    if (!cap || cap.key === lastToastKey) return;
    lastToastKey = cap.key;
    const box = document.getElementById('photoToast');
    if (!box) return;
    const img = document.getElementById('photoToastImg');
    const nm = document.getElementById('photoToastName');
    const mt = document.getElementById('photoToastMeta');
    if (img) img.src = imgUrl(cap.file, true);
    if (nm) nm.textContent = cap.name;
    if (mt) mt.textContent = `${ANGLE_CN[cap.angle] || cap.angle} · ${DIST_CN_UI[cap.dist] || ''} · 第 ${cap.t} 楼`;
    box.hidden = false;
    box.onclick = () => { box.hidden = true; openAlbum(); openPhoto(cap.key); };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { box.hidden = true; }, 6000);
  }

  /* 相册交互：入口、翻拍、放大关闭 */
  document.addEventListener('click', (e) => {
    if (e.target.closest('#openAlbumBtn')) { openAlbum(); return; }
    const p = e.target.closest('#albumWall .photo[data-key]');
    if (p) { openPhoto(p.dataset.key); return; }
    const det = e.target.closest('#albumDetail');
    if (det) det.hidden = true;
  });

  /* ---------- 渲染：snapshot → 面板（真机唯一入口） ---------- */
  const lineOf = heart => {
    const [d, c] = LINES;
    return heart >= c ? 'crash' : heart >= d ? 'deform' : '';
  };
  function renderSnapshot(snap) {
    currentSnap = snap;
    renderAlbum(snap);
    showPhotoToast(snap);
    currentHeart = snap.player.heart;
    currentMode = snap.mode;
    if (audioOn) updateRainTunnel();
    const bpm = Math.round(heartToBpm(currentHeart));
    document.getElementById('heartNum').textContent = currentHeart;
    document.getElementById('bpmNum').textContent = bpm + ' BPM';
    const miniHeartNum = document.getElementById('miniHeartNum');
    if (miniHeartNum) miniHeartNum.textContent = currentHeart;
    const miniBpmNum = document.getElementById('miniBpmNum');
    if (miniBpmNum) miniBpmNum.textContent = bpm + ' BPM';
    document.getElementById('orbit').style.transform = `rotate(${135 + currentHeart / 100 * 270}deg)`;
    dial.setAttribute('aria-label', `心跳${currentHeart}，量程0至100，甜区40至65`);
    root.style.setProperty('--beat', `${60 / bpm}s`);
    const line = lineOf(currentHeart);
    document.getElementById('instrument').dataset.line = line;
    root.dataset.line = line;
    /* 体力：30 气喘 / 10 脱力（数值策划规则） */
    const st = snap.player.stamina;
    const band = st < 10 ? ['red', '· 脱力'] : st < 30 ? ['yellow', '· 气喘'] : ['green', ''];
    const box = document.getElementById('staminaBox');
    if (box) box.dataset.band = band[0];
    const sval = document.getElementById('staminaVal');
    if (sval) sval.textContent = st + '%';
    const sfill = document.getElementById('staminaFill');
    if (sfill) sfill.style.width = st + '%';
    const fullBox = document.getElementById('fullStaminaBox');
    if (fullBox) {
      fullBox.dataset.band = band[0];
      const fullSVal = document.getElementById('fullStaminaVal');
      if (fullSVal) fullSVal.textContent = st + '%';
      const bname = document.getElementById('bandName');
      if (bname) bname.textContent = band[1];
      const fullFill = document.getElementById('fullStaminaFill');
      if (fullFill) fullFill.style.width = st + '%';
      fullBox.querySelector('.stamina-meter')?.setAttribute('aria-valuenow', st);
    }
    /* 日段×模式 + 距离档（接触/车厢 = 朋友的位，pip 换暖色提醒双态语义） */
    document.getElementById('phase').textContent = MODE_NAMES[snap.mode] || snap.mode;
    document.getElementById('distName').textContent = DIST_NAMES[snap.dist] || snap.dist;
    /* 距离档双栖语义：潜行与接触是两套距离 */
    document.getElementById('distStat').dataset.tip = `时段：${SLOT_NAMES[snap.slot] || snap.slot} · 模式：${MODE_NAMES[snap.mode] || snap.mode}\n` +
      ((snap.mode === 'contact' || snap.mode === 'vehicle')
        ? '接触距离：隔街招呼 / 店内对话 / 并肩同行 / 私密。越近话题越深，独处机会出现在最近档。'
        : '尾行距离：目视远端 / 同街 / 身后 / 贴身。越近看得越多，但她的察觉和你的心跳也涨得越快。');
    const order = ['far', 'same', 'close', 'touch'];
    const pipsBox = document.getElementById('pips');
    pipsBox.innerHTML = order.map(d =>
      `<i class="pip${d === snap.dist ? ' active' : ''}"></i>`).join('');
    pipsBox.classList.toggle('warm', snap.mode === 'contact' || snap.mode === 'vehicle');
    /* v0.8 身份徽记：吃快照 identity 字段（零楼开局写入引擎，随快照流转） */
    updateIdBadge(snap);
    /* 突发环境音效（暗巷猫叫/庭院狗叫：百分比推导种子判定） */
    if (snap.envSfx) {
      playEnvAudio(snap.envSfx);
      const sfxNotice = snap.envSfx === 'cat'
        ? '暗巷深处传来野猫受惊的尖叫……'
        : '附近的院落里隐隐传来两声警惕的犬吠……';
      if (!snap.herAlert) snap.herAlert = sfxNotice;
    }
    /* 她的动静警示槽（过档事件亮起，模拟停留两段后自隐） */
    const herAlert = document.getElementById('herAlert');
    if (snap.herAlert) {
      herAlert.textContent = snap.herAlert;
      herAlert.classList.add('show');
      clearTimeout(renderSnapshot._herT);
      renderSnapshot._herT = setTimeout(() => herAlert.classList.remove('show'), 8000);
    } else herAlert.classList.remove('show');
    /* 携行 + 五维属性 + 阈值标签 + 标签栈 */
    document.getElementById('cash').textContent = snap.player.cash;
    document.getElementById('pi').textContent = snap.player.pi;
    /* ═══ 她的鞋具：只露鞋名，敏捷修正/步声/距离折算细节走悬停 ═══ */
    {
      const shoeLine = document.getElementById('herGear');
      const info = snap.target && snap.target.shoeInfo;
      const SHOE_FALLBACK = {
        heel: ['高跟鞋', -1, 3], flats: ['平底鞋', 0, 1], sneakers: ['运动鞋', 1, 1],
        barefoot: ['赤脚', 0, 1], slippers: ['拖鞋', -1, 2], boots: ['靴子', 0, 3],
        platform: ['松糕鞋', -1, 2], sandals: ['凉鞋', 0, 2], leather: ['小皮鞋', 0, 2]
      };
      const DIST_CN = { far: '远端', same: '同街', close: '身后', touch: '贴身' };
      const LEVEL_CN = ['静', '轻', '中', '响', '很响', '极响'];
      let row = info;
      if (!row) {
        // 老快照兼容：只有音频码时退回本地表（声级按同街基准）
        const key = String((snap.target && snap.target.shoe) || '').replace(/^shoe_/, '');
        const fb = SHOE_FALLBACK[key];
        if (fb) row = { name: fb[0], agi: fb[1], noise: fb[2], level: fb[2], distFactor: 1 };
      }
      if (shoeLine) {
        if (row) {
          const nameEl = document.getElementById('herGearName');
          if (nameEl) nameEl.textContent = row.name;
          const agiTxt = row.agi === 0 ? '敏捷 不变' : `敏捷 ${row.agi > 0 ? '+' : '−'}${Math.abs(row.agi)}`;
          const lv = Math.max(0, Math.min(5, Math.round(row.level)));
          shoeLine.setAttribute('data-tip',
            `${row.name} · ${agiTxt}；步声 ${row.noise} 级，${DIST_CN[snap.dist] || '同街'}时 ${lv} 级（${LEVEL_CN[lv]}）`);
          shoeLine.hidden = false;
        } else {
          shoeLine.hidden = true;
        }
      }
    }

    /* ═══ 接近度五档刻度进度轨 + 悬停近 5 项流水 ═══ */
    const prox = snap.player.proximity ?? 0;
    const proxInput = document.getElementById('prox');
    if (proxInput) proxInput.value = prox;
    const proxValEl = document.getElementById('proxVal');
    if (proxValEl) proxValEl.textContent = prox;
    const proxFillEl = document.getElementById('proxFill');
    if (proxFillEl) proxFillEl.style.width = `${Math.min(prox, 100)}%`;

    const PROX_STAGES = [
      { max: 19, name: '陌生', perk: '无额外减免' },
      { max: 39, name: '眼熟', perk: '她的警觉增益 ×0.8' },
      { max: 59, name: '有交集', perk: '她的警觉增益 ×0.6' },
      { max: 79, name: '可搭话', perk: '防备自然回落加快 · 谎言穿帮宽容' },
      { max: 100, name: '独处不设防', perk: '终局行动门禁解除' }
    ];
    let curStageIdx = 0;
    if (prox >= 80) curStageIdx = 4;
    else if (prox >= 60) curStageIdx = 3;
    else if (prox >= 40) curStageIdx = 2;
    else if (prox >= 20) curStageIdx = 1;
    else curStageIdx = 0;

    const curStage = PROX_STAGES[curStageIdx];
    const proxStageEl = document.getElementById('proxStage');
    if (proxStageEl) proxStageEl.textContent = `【${curStage.name}】`;

    // 渲染 5 个节点状态
    const nodeThresholds = [0, 20, 40, 60, 80];
    const nodeNames = ['0 陌生', '20 眼熟', '40 交集', '60 搭话', '80 不设防'];
    const pnodesHtml = nodeThresholds.map((th, idx) => {
      const isPassed = prox >= th;
      const isActive = idx === curStageIdx;
      return `<div class="pnode${isPassed ? ' passed' : ''}${isActive ? ' active' : ''}" style="left: ${th}%;">
        <span class="pdot"></span>
        <span class="plabel">${nodeNames[idx]}</span>
      </div>`;
    }).join('');
    const proxNodesEl = document.getElementById('proxNodes');
    if (proxNodesEl) proxNodesEl.innerHTML = pnodesHtml;

    // 悬停提示：五档说明、距离下一档所需点数、最近 5 次增减明细
    let nextStageText = '已达终局门槛';
    let remainPts = 0;
    if (curStageIdx < 4) {
      const nextTh = nodeThresholds[curStageIdx + 1];
      remainPts = nextTh - prox;
      nextStageText = `【${nodeNames[curStageIdx + 1]}】还需 ${remainPts} 点`;
    }

    const proxLogs = (snap.proxLog && snap.proxLog.length > 0) ? snap.proxLog : ['（暂无近期变动记录）'];

    const proxTip = `接近度：${prox} / 100【${curStage.name}】
· 下一档进度：${nextStageText}
· 当前特权：${curStage.perk}
─────────────────
最近 5 次增减明细：
${proxLogs.slice(0, 5).join('\n')}`;
    const proxTrackWrapEl = document.getElementById('proxTrackWrap');
    if (proxTrackWrapEl) proxTrackWrapEl.setAttribute('data-tip', proxTip);

    const ATTR_NAMES = { str: '体格', agi: '敏捷', nrv: '胆量', int: '情报', cha: '口才' };
    const a = (snap.player && snap.player.attrs) || { str: 5, agi: 5, nrv: 5, int: 5, cha: 5 };
    /* 实效值 = 基础 + 标签加值（效果只认标签：物品/特质以标签形态供加值） */
    const bonus = {}, bonusSrc = {};
    for (const t of snap.tags || []) for (const e of (t.effects || [])) {
      if (e.attr) { bonus[e.attr] = (bonus[e.attr] || 0) + e.value; (bonusSrc[e.attr] = bonusSrc[e.attr] || []).push(t.name); }
    }
    const attrsEl = document.getElementById('wx-attrs')
      || document.querySelector('#wx-terminal-dialog #wx-attrs')
      || document.querySelector('.wx-attrs')
      || document.getElementById('attrs');
    if (attrsEl) {
      attrsEl.innerHTML = Object.entries(ATTR_NAMES).map(([k, name]) => {
        const base = a[k] ?? 5;
        const b = bonus[k] || 0;
        const eff = base + b;
        const stat = eff >= 8 ? ' hot' : eff <= 3 ? ' weak' : '';
        const dir = b > 0 ? ' eff-up' : b < 0 ? ' eff-down' : '';
        const tip = b !== 0
          ? `${name} 基础 ${base} ${b > 0 ? '+' : '−'}${Math.abs(b)}（${(bonusSrc[k] || []).join('、')}）＝ ${eff}`
          : `${name} ${base}`;
        return `<div class="attr${dir}${stat}" data-tip="${tip}"><div class="an">${name}</div><div class="av">${eff}</div></div>`;
      }).join('');
    }

    /* 阈值标签：具体价值悬停查看，tag 明面上只显示 名字：效果类别（如 不起眼：遮蔽） */
    const TH_DESC = {
      '身形醒目': '块头大，容易被人记住：更难隐蔽，她多看你一眼的概率更高',
      '不起眼': '瘦小不显眼：更容易藏在人堆里',
      '脚步轻': '走路轻巧：听觉类判定更占便宜',
      '笨拙': '脚步声重：更容易被听见',
      '粗心': '观察粗糙：打量更难看清，运气加成失效',
      '结巴': '一紧张就说不出囫囵话',
    };
    const TH_EFFECT_TYPE = {
      '身形醒目': '隐蔽',
      '不起眼': '遮蔽',
      '脚步轻': '听觉',
      '笨拙': '声响',
      '粗心': '洞察',
      '结巴': '交际',
    };
    const TH_VALUE_TIP = {
      '身形醒目': '隐蔽 -1',
      '不起眼': '遮蔽 +1',
      '脚步轻': '听觉 +1',
      '笨拙': '声响 -1',
      '粗心': '洞察 -1',
      '结巴': '交际 -1',
    };
    const TH = [
      [a.str, '身形醒目', 8, 99], [a.str, '不起眼', 0, 3],
      [a.agi, '脚步轻', 8, 99], [a.agi, '笨拙', 0, 3],
      [a.int, '粗心', 0, 2], [a.cha, '结巴', 0, 2],
    ].filter(([v, , lo, hi]) => v != null && v >= lo && v <= hi).map(([v, name]) => name);
    const attrTagsEl = document.getElementById('wx-attr-tags')
      || document.querySelector('#wx-terminal-dialog #wx-attr-tags')
      || document.getElementById('attrTags');
    if (attrTagsEl) {
      attrTagsEl.innerHTML =
        TH.map(n => `<span class="tag" data-tip="【${n}】具体价值：${TH_VALUE_TIP[n]}（${TH_DESC[n]}）｜ 属性被动">${n}</span>`).join('');
    }

    /* 标签字典规范：既然有颜色区分，去除我方、环境前缀；明面只显示标签名，具体价值悬停查看 */
    const TAG_META = {
      '耳机伪装':   { label: '耳机伪装', valueTip: '隐蔽 +2', owner: 'player', desc: '蓝牙耳机常驻伪装，不易引人起疑' },
      '雨伞遮挡':   { label: '雨伞遮挡', valueTip: '隐蔽 +2', owner: 'player', desc: '伞面遮挡视线与面部' },
      '护身符':     { label: '护身符',   valueTip: '胆量 +1', owner: 'player', desc: '安定心神，胆量检定+1' },
      '操作变形':   { label: '变形',     valueTip: '敏捷 -2', owner: 'player', isDebuff: true, desc: '心跳过70，敏捷检定-2' },
      '操作崩溃':   { label: '崩溃',     valueTip: '敏捷 -4', owner: 'player', isDebuff: true, desc: '心跳过90，手抖严重敏捷检定-4' },
      '气喘':       { label: '气喘',     valueTip: '全检定 -2', owner: 'player', isDebuff: true, desc: '体力<30，呼吸急促全部检定-2' },
      '脱力':       { label: '脱力',     valueTip: '无法奔跑', owner: 'player', isDebuff: true, desc: '体力<10，体力透支禁奔跑' },

      '优势：情报': { label: '优势：情报', valueTip: '双骰取高', owner: 'player', isAdvantage: true, desc: '累计情报点≥60：情报属性检定单骰变双骰（有20必取20/无20有1取1/否则取高）' },
      '优势：敏捷': { label: '优势：敏捷', valueTip: '双骰取高', owner: 'player', isAdvantage: true, desc: '敏捷≥10：敏捷属性检定单骰变双骰（天然铁律同上）' },
      '优势：体格': { label: '优势：体格', valueTip: '双骰取高', owner: 'player', isAdvantage: true, desc: '体格≥10：体格属性检定单骰变双骰；冲突对抗不吃' },
      '优势：口才': { label: '优势：口才', valueTip: '双骰取高', owner: 'player', isAdvantage: true, desc: '口才≥10：口才属性检定单骰变双骰' },
      '优势：胆量': { label: '优势：胆量', valueTip: '甜区上限 +5', owner: 'player', isAdvantage: true, desc: '胆量≥10：甜区上限 65→70，甜区档段位税同步拓宽' },
      
      '提速':       { label: '目标·提速', valueTip: '跟速 DC +2', owner: 'target', desc: '察觉异样步伐加快，跟速检定DC+2' },
      '警觉':       { label: '目标·警觉', valueTip: '察觉 +2', owner: 'target', desc: '频频回头观察，反侦察察觉+2' },
      '结伴':       { label: '目标·结伴', valueTip: '声浪+5 · 胆量+2', owner: 'target', desc: '与同行人并排，声浪+5且胆量+2' },
      '疲惫':       { label: '目标·疲惫', valueTip: '敏锐 -2', owner: 'target', desc: '神情困顿，敏锐察觉-2' },
      '高跟鞋':     { label: '目标·高跟鞋', valueTip: '清脆敲击声', owner: 'target', desc: '细高跟鞋，步频清脆，跟钉敲击回响；驱动高跟鞋脚步声' },
      '平底鞋':     { label: '目标·平底鞋', valueTip: '轻捷踏步声', owner: 'target', desc: '薄底平底单鞋，步履轻捷均匀；驱动平底鞋脚步声' },
      '运动鞋':     { label: '目标·运动鞋', valueTip: '胶底微摩擦', owner: 'target', desc: '软胶底球鞋，触地静音微抓地摩擦；驱动运动鞋脚步声' },
      '赤脚':       { label: '目标·赤脚',   valueTip: '肉掌触地声', owner: 'target', desc: '脱鞋赤脚，肉掌拍击湿瓷砖/地面微黏声；驱动赤脚脚步声' },
      '拖鞋':       { label: '目标·拖鞋',   valueTip: '啪嗒拖地声', owner: 'target', desc: '居家拖鞋，啪嗒拖行声；驱动拖鞋脚步声' },
      '靴子':       { label: '目标·靴子',   valueTip: '硬底重踏声', owner: 'target', desc: '重底皮革靴子，硬质厚重踏步声；驱动靴子脚步声' },
      '松糕鞋':     { label: '目标·松糕鞋', valueTip: '厚底钝响',   owner: 'target', desc: '厚底松糕鞋，钝重沉闷踏步；驱动松糕鞋脚步声' },
      '凉鞋':       { label: '目标·凉鞋',   valueTip: '细带轻拍声', owner: 'target', desc: '夏日细带凉鞋，细带拍脚后跟轻脆碎步；驱动凉鞋脚步声' },
      '小皮鞋':     { label: '目标·小皮鞋', valueTip: '真皮干练声', owner: 'target', desc: '硬真皮底乐福鞋/女式单鞋，干练清脆；驱动小皮鞋脚步声' },

      '雨幕':       { label: '雨幕',     valueTip: '隐蔽 +2', owner: 'scene', desc: '雨幕遮蔽视听，自身隐蔽+2' },
      '湿滑':       { label: '湿滑',     valueTip: '敏捷 -2', owner: 'scene', desc: '地面青苔湿滑，敏捷移动-2' },
      '雨夜掩护':   { label: '雨幕',     valueTip: '隐蔽 +2', owner: 'scene', desc: '雨幕遮蔽视听，自身隐蔽+2' },
      '老石板湿滑': { label: '湿滑',     valueTip: '敏捷 -2', owner: 'scene', desc: '地面青苔湿滑，敏捷移动-2' },
      '人流掩护':   { label: '人流',     valueTip: '隐蔽 +2', owner: 'scene', desc: '密集人潮掩护，不易被锁定' },
      '暴雨喧嚣':   { label: '喧嚣',     valueTip: '脚步声 -3', owner: 'scene', desc: '雷暴雨声压制细碎脚步' },
      '地面湿滑':   { label: '湿滑',     valueTip: '失足 DC +2', owner: 'scene', desc: '积水路滑，奔跑有滑倒风险' },
    };

    const tagsEl = document.getElementById('tags')
      || document.querySelector('#wx-terminal-dialog #tags');
    if (tagsEl) {
      tagsEl.innerHTML = (snap.tags || []).map(t => {
        const meta = TAG_META[t.name] || {};
        const owner = t.owner || meta.owner || 'player';
        const isFading = t.duration === 'scene' && (t.count || 2) <= 1;
        const lifeText = t.duration === 'flag' ? '持续中' : `剩${t.count || 2}段`;

        let displayName = meta.label;
        if (!displayName) {
          if (owner === 'target') displayName = `目标·${t.name}`;
          else displayName = t.name;
        }

        let valueTip = meta.valueTip || (t.effects && t.effects.length ? t.effects.map(e => e.attr ? `${ATTR_NAMES[e.attr]} ${e.value > 0 ? '+' : ''}${e.value}` : '').join(' ') : '生效中');

        let cls = 'tag';
        if (meta.isAdvantage) cls += ' advantage';
        else if (owner === 'target') cls += ' target';
        else if (owner === 'scene') cls += ' scene';
        else if (meta.isDebuff || t.name.includes('变形') || t.name.includes('崩溃') || t.name.includes('气喘') || t.name.includes('脱力')) cls += ' debuff';
        if (isFading) cls += ' fading';

        const ownerNameMap = { player: '我方状态', target: '目标行为', scene: '环境修正' };
        const tip = `【${displayName}】具体价值：${valueTip}（${meta.desc || '规则标签'}）\n· 归属：${ownerNameMap[owner] || '系统'} · 时长：${lifeText}`;

        return `<span class="${cls}" data-tip="${tip}">${displayName}</span>`;
      }).join('') || '<span class="label">无</span>';
    }

    /* 战术行囊持有物动态渲染 */
    renderInventory(snap);

    /* M4-2 行动胶囊动态渲染 */
    renderActionCapsules(snap);

    /* 她的信号流（只记事实） */
    const signalEl = document.getElementById('signal');
    if (signalEl) {
      signalEl.innerHTML = (snap.signal || []).map(([tm, txt]) =>
        `<li><time>${tm}</time><span>${txt}</span></li>`).join('') || '<li><span class="label">暂无观察记录</span></li>';
    }
    const assessEl = document.getElementById('assess');
    if (assessEl) {
      assessEl.textContent = snap.assess || '';
      assessEl.style.display = snap.assess ? '' : 'none';
    }
    const ledgerEl = document.getElementById('ledger');
    if (ledgerEl) ledgerEl.textContent = snap.ledger || '';

    const floorBadge = document.getElementById('terminalFloorBadge');
    if (floorBadge) {
      const day = (snap.player && snap.player.date) || 1;
      const mName = MODE_NAMES[snap.mode] || snap.mode || '潜行';
      floorBadge.textContent = `第 ${day} 晚 · ${mName}阶段`;
    }
    /* ═══ 地图 HUD 渲染 ═══ */
    /* 1. 常驻动线雷达轨 (.route-tracker) */
    const routeTrackerEl = document.getElementById('routeTracker');
    if (routeTrackerEl) {
      const { hasRain, isStorm } = getRainState(snap);
      routeTrackerEl.classList.toggle('is-storm', isStorm);
      routeTrackerEl.classList.toggle('is-rain', !isStorm && hasRain);
      routeTrackerEl.classList.toggle('is-clear', !hasRain);
    }
    const route = snap.route;
    const districtEl = document.getElementById('routeDistrict');
    const placeEl = document.getElementById('routePlace');
    const weatherEl = document.getElementById('routeWeather');
    const strikeTagEl = document.getElementById('routeStrikeTag');
    const remainEl = document.getElementById('routeRemain');
    const stepperEl = document.getElementById('routeStepper');

    // 大区徽章与场所名
    let distBadge = snap.area || '未知';
    if (distBadge.includes('CBD')) distBadge = 'CBD';
    else if (distBadge.includes('老城')) distBadge = '老城';
    else if (distBadge.includes('娱乐') || distBadge.includes('红灯')) distBadge = '娱乐区';
    else if (distBadge.includes('郊野') || distBadge.includes('豪宅')) distBadge = '郊野区';
    else if (distBadge.includes('据点')) distBadge = '据点';
    districtEl.textContent = distBadge;
    const hereIdx = route ? (route.here ?? 0) : 0;
    const isCurrentKnown = (route && route.known && hereIdx >= 0) ? route.known[hereIdx] : 1;
    placeEl.textContent = (isCurrentKnown ? snap.place : '？') || '移动中';

    // 天气标签：图标走统一单色集，文案去掉自带的 emoji（mock / LLM 都可能带）
    const wKey = snap.weather === 'storm' ? 'storm' : snap.weather === 'rain' ? 'rain'
      : snap.weather === 'clear' ? 'moon' : snap.weather === 'day' ? 'sunny' : 'moon';
    const wText = stripEmoji(snap.weatherName || '')
      || (snap.weather === 'storm' ? '暴雨' : snap.weather === 'rain' ? '小雨' : '晴夜');
    weatherEl.innerHTML = ico(wKey) + ' ' + wText;

    // 终局动手状态
    // 类名契约：初版标记写的是 slim-tag strike-tag（样式在 :123/:128），
    // 这里曾改写成 route-tag（窄条上没有对应字号，回落成 12px，实测占 117px），
    // 导致窄条在手机上被红线标签吃掉场所名。保留 slim-tag 前缀，修饰符与 CSS 同名。
    if (snap.strikeSealed) {
      strikeTagEl.className = 'slim-tag strike-tag sealed';
      strikeTagEl.textContent = '探头锁定 · 禁动手';
      strikeTagEl.setAttribute('data-tip', '当前处于高防或公立探头直照区域，无法发动终局行动');
    } else {
      strikeTagEl.className = 'slim-tag strike-tag allowed';
      strikeTagEl.textContent = '深水盲区 · 终局开';
      strikeTagEl.setAttribute('data-tip', '当前处于盲区或掩体死角，终局行动扳机常开');
    }

    // 剩余步数与步进轨（未探明地名留出位置显示 ？ 就好）
    if (route && route.nodes && route.nodes.length) {
      const total = route.nodes.length;
      const remainSteps = total - 1 - hereIdx;

      if (snap.mode === 'prepare' || hereIdx < 0) {
        remainEl.textContent = '准备期待命';
      } else if (remainSteps <= 0) {
        remainEl.textContent = '已至终点安全区';
      } else {
        remainEl.textContent = `离收摊剩 ${remainSteps} 步`;
      }

      const NODE_ICONS = {
        '学校正门': 'school', '老水泥天桥': 'bridge', '24h便利店': 'store', '居民杂物暗巷': 'alley', '老旧单元楼道': 'door',
        '写字楼大堂': 'office', '跨街天桥': 'bridge', '地铁枢纽': 'subway', '沿街便利店': 'store', 'B2地下车库': 'parking',
        '酒吧员工后门': 'bar', '大排档夜市': 'alley', '沿江便利店': 'store', '一线天幽湿窄弄': 'rain', '出租屋楼道铁门': 'door'
      };
      const stepsHtml = [];
      route.nodes.forEach((nodeName, i) => {
        const isPassed = hereIdx >= 0 && i < hereIdx;
        const isCurrent = i === hereIdx;
        const isTerminal = i === total - 1;
        const isKnown = route.known ? route.known[i] : 1;
        const label = isKnown ? nodeName : '？';
        const icon = isKnown ? ico(NODE_ICONS[nodeName] || 'pin') : ico('unknown');

        if (i > 0) {
          const linePassed = hereIdx >= 0 && i <= hereIdx;
          stepsHtml.push(`<div class="step-line ${linePassed ? 'passed' : 'future'}"></div>`);
        }

        const itemClasses = ['step-item'];
        if (isPassed) itemClasses.push('passed');
        if (isCurrent) itemClasses.push('current');
        if (isTerminal) itemClasses.push('terminal');
        if (!isKnown) itemClasses.push('unknown');

        stepsHtml.push(`
          <div class="${itemClasses.join(' ')}" data-tip="${isKnown ? nodeName : '？'}">
            <span class="step-dot"><i class="step-ico">${icon}</i></span>
            <span class="step-name">${label}</span>
          </div>
        `);
      });
      stepperEl.innerHTML = stepsHtml.join('');
    } else {
      remainEl.textContent = '常规';
      stepperEl.innerHTML = '';
    }

    /* 2. 抽屉层战术沙盘 (.envbox) */
    const fam = snap.fam ?? 0;
    const famEl = document.getElementById('areaFam');
    famEl.textContent = `熟悉 ${fam}/10` + (fam >= 10 ? ' · 熟区' : '');
    document.getElementById('famFill').style.width = `${Math.min(fam * 10, 100)}%`;
    document.getElementById('famDesc').textContent = fam >= 10 ? '熟区 (刺激减半)' : fam >= 5 ? '半熟' : '生疏';

    // 环境修正标签
    const ENV_OF = {
      rainNight: [['雨幕', '隐蔽 +2，她的脚步更慢'], ['夜色', '隐蔽 +2，认脸更难']],
      night: [['夜色', '隐蔽 +2，认脸更难']],
      day: [], open: [['空旷', '无处可藏：隐蔽 −2']],
    };
    const SLOT_TAGS = { e18_21: [['人流拥挤', '好藏身，也难追逐']], late: [['空旷', '无处可藏：隐蔽 −2']] };
    const envList = [...(ENV_OF[snap.env] || []), ...(SLOT_TAGS[snap.slot] || [])];
    document.getElementById('envTags').innerHTML =
      envList.map(([n, d]) => `<span class="envtag" data-tip="${n}：${d}">${n}</span>`).join('')
      || '<span class="label">当前环境无额外修正</span>';

    // 战术通路 exits
    const exits = snap.exits || [];
    document.getElementById('exitChips').innerHTML = exits.length
      ? exits.map(e => `<span class="chip chip-exit"><span class="chip-ico">›</span>${e}</span>`).join('')
      : '<span class="label">无可用分支通路</span>';

    // 战术特殊位 spots（中控给微点 id，前端翻成玩家可见的人话；未映射的兜底显示原 id）
    const SPOT_LABELS = {
      reception: '前台访客登记', security_clock: '保安定时巡检', pillar_hide: '立柱后躲藏',
      tire_screech: '轮胎锐响位', perch_watch: '高处观察点', ticket_gate: '闸机口',
      sunken_plaza: '下沉广场', bus_wait: '公交候车位', window_watch: '橱窗反光位',
      exit_watch: '出口观察位', fan_mask: '排风扇掩体', ebike_hide: '电驴后躲藏',
      trash_search: '翻找垃圾桶', gate_watch: '校门守望位', rush_mask: '放学人流掩护',
      park_bench: '公园长椅', tree_hide: '树影躲藏', sodium_lamp: '老钠灯下',
      corner_shadow: '墙角阴影', trash_hide: '垃圾桶后躲藏', bike_hide: '单车堆后躲藏',
      trap_corner: '死角陷阱位', listen_home: '楼下听动静', door_crack: '门缝观察',
      try_handle: '试门把', climb_point: '攀爬点', drunk_exit: '醉客出口',
      carpool_stand: '拼车候车点', bridge_view: '桥头俯望位', hangover_cure: '解酒摊',
      river_rail: '江堤护栏边', sober_walk: '清醒步道', vomit_point: '常被吐脏的墙角',
      reed_hide: '芦苇丛躲藏', wet_pavement: '湿滑路面', aircon_drip: '空调滴水檐',
      ambush_corner: '伏击拐角', spiral_stairs: '旋梯转角', clothesline_hide: '晾衣绳后躲藏',
      overlook: '天台俯瞰位', curve_hide: '弯道树影躲藏', mart_cashier: '超市收银台',
      pump_island: '加油泵岛', open_road: '开阔长直路', patrol_watch: '巡逻守望位',
      ebike_cache: '藏电驴点', tree_ambush: '林间伏击位', gate_intercom: '大门对讲机',
      infrared_cam: '红外探头', dog_kennel: '狗舍', sprinkler: '喷灌草坪',
      pick_side_door: '侧门技术开锁', smart_lock: '智能门锁', home_safe: '保险柜'
    };
    const spots = snap.spots || [];
    const spotRow = document.getElementById('spotRow');
    if (spots.length) {
      spotRow.style.display = '';
      document.getElementById('spotChips').innerHTML = spots.map(s => `<span class="chip chip-spot" data-tip="${s}"><span class="chip-ico">◎</span>${SPOT_LABELS[s] || s}</span>`).join('');
    } else {
      spotRow.style.display = 'none';
    }

    // 逃跑预警 sanctuaryAlert
    const warn = snap.sanctuaryAlert || '';
    const warnRow = document.getElementById('sanctuaryRow');
    if (warn) {
      warnRow.style.display = '';
      document.getElementById('sanctuaryTip').innerHTML = `<span class="chip chip-sanctuary"><span class="chip-ico">${ico('warn')}</span>${warn}</span>`;
    } else {
      warnRow.style.display = 'none';
    }

    /* 她的警觉：档位 + 五格刻度（终端与心跳弹层共用同一套档位） */
    const alertTier = alertTierOf(snap);
    const pipsHtml = ALERT_TIERS.map((t, i) => `<i class="${i <= alertTier.idx ? 'on' : ''}"></i>`).join('');
    const pipsEl = document.getElementById('alertPips');
    if (pipsEl) pipsEl.innerHTML = pipsHtml;
    const alertTxt = document.getElementById('alertText');
    if (alertTxt) {
      alertTxt.textContent = alertTier.name;
      alertTxt.setAttribute('data-tip', alertTier.tip);
    }
    const alertRowEl = document.getElementById('alertRow');
    if (alertRowEl) alertRowEl.setAttribute('data-tier', String(alertTier.idx));

    /* 心跳弹层右侧窄栏：她的警觉（同档位，不报数） */
    const popPips = document.getElementById('popoverAlertPips');
    if (popPips) popPips.innerHTML = pipsHtml;
    const popText = document.getElementById('popoverAlertText');
    if (popText) {
      popText.textContent = alertTier.name;
      popText.setAttribute('data-tip', alertTier.tip);
    }
    const popRange = document.getElementById('popoverAlertRange');
    if (popRange) popRange.textContent = alertTier.range;
    const popCard = document.getElementById('popoverHerState');
    if (popCard) popCard.setAttribute('data-tier', String(alertTier.idx));

    /* 3. 她的档案 · 长焦偷拍取景框对焦与应激手抖联动 */
    const vfFrame = document.getElementById('vfFrame');
    const vfMeta = document.getElementById('vfMeta');
    const vfAfBadge = document.getElementById('vfAfBadge');
    if (vfFrame && vfAfBadge) {
      const prox = snap.player.proximity ?? 0;
      const dist = snap.dist || 'same';
      vfFrame.classList.remove('af-searching', 'af-tracking', 'af-locked', 'shake-deform', 'shake-crash');
      if (dist === 'far' || prox < 20) {
        vfFrame.classList.add('af-searching');
        vfAfBadge.textContent = '[ AF-SEARCHING ]';
        if (vfMeta) vfMeta.textContent = 'ISO 12800 · 1/60s · 距离 25m';
      } else if (dist === 'same' || prox < 40) {
        vfFrame.classList.add('af-tracking');
        vfAfBadge.textContent = '[ AF-TRACKING ]';
        if (vfMeta) vfMeta.textContent = 'ISO 6400 · 1/80s · 距离 16m';
      } else {
        vfFrame.classList.add('af-locked');
        vfAfBadge.textContent = '[ AF-LOCK ]';
        if (vfMeta) vfMeta.textContent = `ISO 3200 · 1/125s · 距离 ${dist === 'touch' ? '3m' : '8m'}`;
      }
      if (line === 'crash') vfFrame.classList.add('shake-crash');
      else if (line === 'deform') vfFrame.classList.add('shake-deform');
    }

    const prevStatusEl = document.getElementById('previewStatus');
    if (prevStatusEl) {
      prevStatusEl.textContent =
        `心跳 ${currentHeart} · 换算 ${bpm} BPM · 体力 ${st}%` + (line ? ` · 操作${line === 'crash' ? '崩溃' : '变形'}` : ' · 手稳');
    }
    /* 心跳历史迷你曲线（近 12 段；真机从中控逐楼快照推入） */
    renderSnapshot._hist = renderSnapshot._hist || [];
    renderSnapshot._hist.push(currentHeart);
    if (renderSnapshot._hist.length > 12) renderSnapshot._hist.shift();
    const hist = renderSnapshot._hist;
    document.getElementById('sparkLine').setAttribute('points',
      hist.map((v, i) => `${(i / 11) * 120},${18 - (v / 100) * 16}`).join(' '));
    /* 猎手状态门禁与环境音效联动更新 */
    if (audioOn) {
      if (HUNTER_MODES[currentMode]) syncAudioTempo();
      updateAudioStatus();
    }
  }

  /* ---------- 交互：心跳仪表盘向上弹出子菜单 + 方案 A 居中手持战术终端 + 🎵声音子面板 ---------- */
  const heartPillBtn = document.getElementById('heartPillBtn');
  const heartPopoverCard = document.getElementById('heartPopoverCard');
  const heartPopoverClose = document.getElementById('heartPopoverClose');
  const terminalToggleBtn = document.getElementById('wx-terminal-toggle-btn') || document.getElementById('terminalToggleBtn');
  const terminalDialog = document.getElementById('wx-terminal-dialog') || document.getElementById('wx-terminal-backdrop') || document.getElementById('terminalBackdrop');
  const terminalCloseBtn = document.getElementById('wx-terminal-close-btn') || document.getElementById('terminalCloseBtn');
  const audioMenuBtn = document.getElementById('audioMenuBtn');
  const audioPopoverPanel = document.getElementById('audioPopoverPanel');

  let isPopoverOpen = false;
  let isTerminalOpen = false;
  let isAudioPanelOpen = false;

  function reportLayout() {
    if (window.parent === window) return;
    try {
      if (isPopoverOpen) {
        parent.postMessage({ wxH: 340, wxPop: true, wxDrawer: false }, '*');
      } else {
        parent.postMessage({ wxH: 38, wxPop: false, wxDrawer: false }, '*');
      }
    } catch (e) {}
  }

  function updateHeartPopoverPos() {
    // 采用稳定绝对定位：依托 .heart-popover-wrap 向上弹出，免疫祖先 transform 造成的 fixed 坐标错乱飞移
    if (!heartPopoverCard || !isPopoverOpen) return;
    heartPopoverCard.style.position = '';
    heartPopoverCard.style.bottom = '';
    heartPopoverCard.style.right = '';
    heartPopoverCard.style.left = '';
    heartPopoverCard.style.top = '';
  }

  function setPopover(open) {
    isPopoverOpen = open;
    if (heartPopoverCard) {
      heartPopoverCard.classList.toggle('show', isPopoverOpen);
      if (isPopoverOpen) updateHeartPopoverPos();
    }
    if (heartPillBtn) {
      heartPillBtn.classList.toggle('open', isPopoverOpen);
      heartPillBtn.setAttribute('aria-expanded', String(isPopoverOpen));
    }
    // 互斥：打开心跳表盘时自动收拢终端与声音面板
    if (isPopoverOpen) {
      if (terminalDialog && terminalDialog.open) setTerminal(false);
      if (isAudioPanelOpen) setAudioPanel(false);
    }
    reportLayout();
  }

  function syncTerminalBtnState() {
    const isOpen = !!(terminalDialog && terminalDialog.open);
    isTerminalOpen = isOpen;
    if (terminalToggleBtn) {
      terminalToggleBtn.classList.toggle('active', isOpen);
      terminalToggleBtn.setAttribute('aria-expanded', String(isOpen));
      const txt = terminalToggleBtn.querySelector('.term-txt');
      if (txt) txt.textContent = isOpen ? '关闭终端' : '战术终端';
    }
  }

  function setTerminal(open) {
    if (!terminalDialog) return;
    if (open) {
      if (!terminalDialog.open) {
        if (typeof terminalDialog.showModal === 'function') {
          terminalDialog.showModal();
        } else {
          terminalDialog.setAttribute('open', '');
        }
      }
    } else {
      if (terminalDialog.open) {
        if (typeof terminalDialog.close === 'function') {
          terminalDialog.close();
        } else {
          terminalDialog.removeAttribute('open');
        }
      }
    }
    syncTerminalBtnState();
    // 互斥：打开终端时自动收起心跳表盘与声音面板
    if (terminalDialog.open) {
      if (isPopoverOpen) setPopover(false);
      if (isAudioPanelOpen) setAudioPanel(false);
    }
  }

  if (terminalDialog) {
    terminalDialog.addEventListener('close', syncTerminalBtnState);
  }

  function setAudioPanel(open) {
    isAudioPanelOpen = open;
    if (audioPopoverPanel) {
      audioPopoverPanel.style.display = isAudioPanelOpen ? 'flex' : 'none';
    }
    if (audioMenuBtn) {
      audioMenuBtn.classList.toggle('active', isAudioPanelOpen);
      audioMenuBtn.setAttribute('aria-expanded', String(isAudioPanelOpen));
    }
  }

  if (heartPillBtn) {
    heartPillBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setPopover(!isPopoverOpen);
    });
  }

  if (terminalToggleBtn) {
    terminalToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = !!(terminalDialog && terminalDialog.open);
      setTerminal(!isOpen);
    });
  }

  window.addEventListener('resize', updateHeartPopoverPos);
  window.addEventListener('scroll', updateHeartPopoverPos, true);

  // 全局捕获：关闭按钮、遮罩点击、外部失焦与 ESC 键（严格限定本插件作用域，绝不干扰酒馆与其他扩展）
  document.addEventListener('click', (e) => {
    // 1. 关闭按钮：仅限本插件拥有的关闭触发器
    const closeBtn = e.target.closest('[data-wx-close], [data-close], .wx-modal-close, .close-icon, #wx-terminal-close-btn, #terminalCloseBtn, #heartPopoverClose');
    if (closeBtn && closeBtn.closest('#wx-statusbar-root, #wx-modals-root, dialog.wx-dialog, .trpg')) {
      e.preventDefault();
      e.stopPropagation();
      if (closeBtn.id === 'heartPopoverClose') {
        setPopover(false);
      } else if (closeBtn.id === 'wx-terminal-close-btn' || closeBtn.id === 'terminalCloseBtn' || closeBtn.closest('#wx-terminal-dialog')) {
        setTerminal(false);
      } else {
        const d = closeBtn.closest('dialog.wx-dialog');
        if (d) d.close();
      }
      return;
    }

    // 2. 点击尾行专属 dialog.wx-dialog 自身背景 (外围空白)
    if (e.target.tagName === 'DIALOG' && e.target.classList.contains('wx-dialog') && e.target.open) {
      const rect = e.target.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        e.target.close();
        return;
      }
    }

    // 4. 点击心跳仪表盘外部收起
    if (isPopoverOpen && heartPopoverCard && !heartPopoverCard.contains(e.target) && !heartPillBtn?.contains(e.target)) {
      setPopover(false);
    }

    // 5. 点击声音设置外部收起
    if (isAudioPanelOpen && audioPopoverPanel && !audioPopoverPanel.contains(e.target) && !audioMenuBtn?.contains(e.target)) {
      setAudioPanel(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isPopoverOpen) setPopover(false);
      if (isTerminalOpen) setTerminal(false);
      if (isAudioPanelOpen) setAudioPanel(false);
      // 仅关闭尾行自有的 dialog，绝不波及宿主或其他扩展
      document.querySelectorAll('dialog.wx-dialog[open]').forEach(d => d.close());
    }
  });

  const items = {
    headphones: { name: '耳机', description: '持有物：耳机。生效修正：[耳机伪装] 隐蔽 +2。' },
    umbrella: { name: '雨伞', description: '持有物：雨伞。雨天场景可提供 [雨幕] 掩护加成。' },
    amulet: { name: '护身符', description: '持有物：护身符。生效标签：胆量 +1（效果只认标签，摘下即失效）。' }
  };
  const openers = new WeakMap();
  function openDialog(id, button) {
    const dialog = document.getElementById(id);
    if (!dialog || dialog.open) return;
    openers.set(dialog, button);
    dialog.showModal();
    if (id === 'wx-profile-dialog' || id === 'profile') playShutterSound();
  }

  async function handleItemAction(action, itemId) {
    const glue = (typeof window !== 'undefined' && window.WxGlue) || (typeof globalThis !== 'undefined' && globalThis.WxGlue);
    const game = glue?.game;
    if (game) {
      if (action === 'equip') game.equipItem(itemId);
      else if (action === 'unequip') game.unequipItem(itemId);
      else if (action === 'use') game.useItem(itemId);
      if (typeof glue.persist === 'function') {
        const snap = await glue.persist();
        renderSnapshot(snap);
      } else {
        renderSnapshot(game.snapshot());
      }
      playFootstepSound();
      return;
    }

    // 独立演示 / 预览降级环境
    if (currentSnap && currentSnap.inventory) {
      const it = currentSnap.inventory.find(i => i.id === itemId);
      if (!it) return;
      if (action === 'equip') {
        currentSnap.inventory.forEach(other => {
          if (other.slot && other.slot === it.slot) other.equipped = false;
        });
        it.equipped = true;
      } else if (action === 'unequip') {
        it.equipped = false;
      } else if (action === 'use') {
        if (itemId === 'energy_drink') {
          currentSnap.player.stamina = Math.min(100, currentSnap.player.stamina + 20);
          currentSnap.player.heart = Math.min(100, currentSnap.player.heart + 10);
        } else if (itemId === 'bento') {
          currentSnap.player.stamina = Math.min(100, currentSnap.player.stamina + 20);
        } else if (itemId === 'onigiri') {
          currentSnap.player.stamina = Math.min(100, currentSnap.player.stamina + 8);
        }
        it.count = (it.count || 1) - 1;
        if (it.count <= 0) {
          currentSnap.inventory = currentSnap.inventory.filter(i => i.id !== itemId);
        }
      }
      renderSnapshot(currentSnap);
      playFootstepSound();
    }
  }

  function handleActionClick(event) {
    const button = event.target.closest('button');
    if (!button) return;
    // 关键门禁：不是尾行组件内部的按钮，直接放行，绝不拦截任何事件！
    if (!button.closest('#wx-statusbar-root, #wx-modals-root, .wx-terminal-backdrop, dialog.wx-dialog, .trpg')) return;

    if (button.id === 'heartbeat-sound') {
      event.preventDefault(); event.stopPropagation();
      void toggleAudio();
    } else if (button.id === 'audioMenuBtn' || button.id === 'wx-audio-menu-btn') {
      event.preventDefault(); event.stopPropagation();
      setAudioPanel(!isAudioPanelOpen);
    } else if (button.dataset.itemAction) {
      event.preventDefault(); event.stopPropagation();
      const action = button.dataset.itemAction;
      const itemId = button.dataset.itemId;
      void handleItemAction(action, itemId);
    } else if (button.dataset.wxItem || button.dataset.item) {
      event.preventDefault(); event.stopPropagation();
      const itemKey = button.dataset.wxItem || button.dataset.item;
      const item = items[itemKey]; if (!item) return;
      const titleEl = document.getElementById('item-title');
      const descEl = document.getElementById('item-description');
      if (titleEl) titleEl.textContent = item.name;
      if (descEl) descEl.textContent = item.description;
      openDialog('wx-item-dialog', button);
    } else if (button.dataset.wxDialog || button.dataset.dialog) {
      event.preventDefault(); event.stopPropagation();
      const rawDiag = button.dataset.wxDialog || button.dataset.dialog;
      const diagId = rawDiag.startsWith('wx-') ? rawDiag : `wx-${rawDiag}-dialog`;
      openDialog(diagId, button);
    }
  }
  document.addEventListener('click', handleActionClick);
  document.querySelectorAll('dialog.wx-dialog').forEach(dialog => {
    dialog.addEventListener('close', () => openers.get(dialog)?.focus({ preventScroll: true }));
  });

  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
    if (typeof REPLAY !== 'undefined' && REPLAY.on) exitReplay();   // 演示/回放互斥
    document.querySelectorAll('[data-preset]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    playFootstepSound();
    renderSnapshot(MOCKS[button.dataset.preset]);
  }));
  document.getElementById('spike')?.addEventListener('click', spike);

  /* ---------- 真机回放（replay.json = tools/drive.mjs 跑出的引擎逐楼真快照） ---------- */
  const REPLAY = { frames: [], idx: 0, on: false };
  const replayToggle = document.getElementById('replayToggle');
  const replayPrev = document.getElementById('replayPrev');
  const replayNext = document.getElementById('replayNext');
  const replayLabel = document.getElementById('replayLabel');

  function exitReplay() {
    REPLAY.on = false;
    if (replayToggle) {
      replayToggle.textContent = '▶ 真机回放';
      replayToggle.setAttribute('aria-pressed', 'false');
    }
    if (replayPrev) replayPrev.hidden = true;
    if (replayNext) replayNext.hidden = true;
    if (replayLabel) replayLabel.hidden = true;
  }
  function renderReplayFrame(i) {
    REPLAY.idx = Math.max(0, Math.min(i, REPLAY.frames.length - 1));
    const f = REPLAY.frames[REPLAY.idx];
    renderSnapshot(f.snap);
    if (replayLabel) replayLabel.textContent = `帧 ${REPLAY.idx + 1}/${REPLAY.frames.length} · ${f.label}`;
  }
  if (replayToggle) {
    replayToggle.addEventListener('click', async () => {
      if (!REPLAY.on) {
        if (!REPLAY.frames.length) {
          try {
            const res = await fetch('replay.json');
            if (!res.ok) throw new Error(res.status);
            REPLAY.frames = (await res.json()).frames || [];
          } catch (e) {
            replayToggle.textContent = '回放文件缺失';
            return;
          }
        }
        REPLAY.on = true;
        replayToggle.textContent = '⏸ 演示模式';
        replayToggle.setAttribute('aria-pressed', 'true');
        if (replayPrev) replayPrev.hidden = false;
        if (replayNext) replayNext.hidden = false;
        if (replayLabel) replayLabel.hidden = false;
        renderReplayFrame(0);
      } else exitReplay();
    });
  }
  if (replayPrev) {
    replayPrev.addEventListener('click', () => { if (REPLAY.on) { playFootstepSound(); renderReplayFrame(REPLAY.idx - 1); } });
  }
  if (replayNext) {
    replayNext.addEventListener('click', () => { if (REPLAY.on) { playFootstepSound(); renderReplayFrame(REPLAY.idx + 1); } });
  }

  document.getElementById('volHeart')?.addEventListener('input', e => { vol.heart = +e.target.value / 100; if (audioContext) applyVolumes(); });
  document.getElementById('volRain')?.addEventListener('input', e => { vol.rain = +e.target.value / 100; if (audioContext) applyVolumes(); });
  document.getElementById('volTinn')?.addEventListener('input', e => { vol.tinnitus = +e.target.value / 100; if (audioOn) tinnitus(); });
  document.getElementById('volStep')?.addEventListener('input', e => { vol.step = +e.target.value / 100; });

  document.addEventListener('visibilitychange', () => {
    root.classList.toggle('motion-paused', document.hidden);
    if (document.hidden) stopAudio('页面已暂停，点击可重新开启心跳声');
  });
  function dispose() {
    stopAudio();
    if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
    observer.disconnect();
  }
  const observer = new MutationObserver(() => { if (!root.isConnected) dispose(); });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('pagehide', dispose);

  /* ═══ 零楼 · 开局面板（v0.8 开局身份制 UI）：选身份 → 分 20 点 → 写 wx_init → 引擎开局。
     零楼数零 token：全程前端本地完成，LLM 从一楼起照快照 identity 字段演戏。
     数据真源 rules.json → identity；此内嵌一份供两端共用，tests/statusbar-create.test.js 对齐防漂移。 ═══ */
  const IDENTITY_DATA = {
    list: {
      student:   { name: '学生', tagline: '放学铃是你的钟表，校园是你的地图',
                   mods: { agi: 1, int: 1 }, perk: '文教区免检——学校正门、学区公交总站畅通无阻',
                   flaw: '无本职工种，打工零工价；同龄圈，对职场人的明线入口窄', job: '打工：零工（无上浮）' },
      criminal:  { name: '罪犯', tagline: '案底在身，黑路熟门',
                   mods: { str: 1, agi: 1, nrv: 2 }, perk: '黑市渠道——器材九折，销赃七五折',
                   flaw: '挂相（遮蔽 −2）；不像正经人（社交 −2）；只能打黑工（七折）', job: '打工：黑工搬运 196 / 294' },
      guard:     { name: '保安', tagline: '值过夜班的人，认得每一张该出现的脸',
                   mods: { str: 1, nrv: 1 }, perk: '物业安保免检——写字楼大堂、地下车库、老楼道',
                   flaw: '排班周轮换昼→夜，夜班周整晚在岗', job: '保安当班 320 固定（本职 384）' },
      detective: { name: '侦探学徒', tagline: '跟单是本行，职业病是跟到底',
                   mods: { int: 1, agi: 1, cha: 1 }, perk: '情报积累快两成——每晚 PI 入账 ×1.2',
                   flaw: '职业病——跟缀一旦开始，今晚收不了手（跟丢或她到家为止）', job: '侦探委托 200~400' },
      bartender: { name: '酒保', tagline: '深夜的吧台后，什么话都听过',
                   mods: { cha: 2, nrv: 1 }, perk: '夜场免检——酒吧后门、大排档街角',
                   flaw: '深夜必须上班——当班夜错过她动线前两段', job: '酒吧当班 360 / 468 ＋小费' },
      coach:     { name: '健身教练', tagline: '肌肉是招牌，也是累赘',
                   mods: { str: 3, cha: 1 }, perk: '若她的日程有健身房——接近度起点 +20',
                   flaw: '大块头（遮蔽 −2）；每天要留两小时锻炼（行动点 −1）', job: '私教课 360 / 540 / 720' },
      otaku:     { name: '阿宅', tagline: '不出门，也知道这城市一半的秘密',
                   mods: { int: 1, cha: 1 }, perk: '开局自带一台针孔摄像机（等值 800）',
                   flaw: '无', job: '远程接单 264 / 370 / 528 ＋被动 150/天' }
    }
  };
  const TARGET_DATA = {
    list: {
      ol: {
        id: 'ol', name: '疲惫的OL', difficulty: 2, stars: '★★☆☆☆', type: '疲惫猎',
        area: '中城CBD ➔ 老城文教区', tagline: '写字楼深夜加完班，高跟鞋敲打在老城夜雨里',
        features: '深夜加班窗口 · [疲惫] 敏锐降低 · 高跟鞋步频清脆',
        windowNote: '工作日 21:00 起下班，疲惫下防备较低，但动线跨区较长',
        shoe: 'shoe_heel',
        stats: { str: 3, agi: 5, per: 6, nrv: 4 }, social: 2, alertMod: 5,
        status: 'ready'
      },
      college: {
        id: 'college', name: '独居女大学生', difficulty: 2, stars: '★★☆☆☆', type: '标准教科书',
        area: '老城文教区', tagline: '晚归的单车停在楼下，耳机里放着不关的音乐',
        features: '校外租房独居 · 课表半固定 · 易分心',
        windowNote: '晚自习或兼职归来，独处窗口大，社交圈单纯',
        shoe: 'shoe_sneakers',
        stats: { str: 3, agi: 4, per: 4, nrv: 4 }, social: 2, alertMod: 0,
        status: 'ready'
      },
      student: {
        id: 'student', name: '晚自习高中生', difficulty: 2, stars: '★★☆☆☆', type: '窗口猎',
        area: '老城文教区', tagline: '沉重的书包压着双肩，放学路只有最后一段独行',
        features: '放学结伴率高 · 独处窗口稀缺 · 日程极固定',
        windowNote: '平日同行人多难以下手，补习晚归或独自值日是唯一窗口',
        shoe: 'shoe_leather',
        stats: { str: 2, agi: 4, per: 4, nrv: 3 }, social: 1, alertMod: -5,
        status: 'ready'
      },
      club: {
        id: 'club', name: '夜店小姐', difficulty: 3, stars: '★★★☆☆', type: '双态猎',
        area: '临江娱乐红灯区', tagline: '后门散场时的冷风吹醒了酒意，包里藏着未拆封的喷雾',
        features: '双态切换 · 醉态迟缓/醒态敏锐 · 凌晨空旷街区',
        windowNote: '凌晨 02:00 后下班，街面空旷，清醒时反侦察意识极高',
        shoe: 'shoe_boots',
        stats: { str: 3, agi: 4, per: 7, nrv: 6 }, social: 3, alertMod: 0,
        status: 'ready'
      },
      wife: {
        id: 'wife', name: '独居人妻', difficulty: 4, stars: '★★★★☆', type: '白昼猎',
        area: '郊野豪宅区 / 老城住宅区', tagline: '锁好院门的那一刻，偌大的客厅只剩电视的荧光',
        features: '白昼不设防 · 丈夫第三方风险 · 定位共享',
        windowNote: '白天家中是不设防窗口；但丈夫随时可能折返，双日程博弈',
        shoe: 'shoe_slippers',
        stats: { str: 3, agi: 3, per: 5, nrv: 4 }, social: 4, alertMod: 0,
        status: 'ready'
      },
      police: {
        id: 'police', name: '便衣女刑警', difficulty: 5, stars: '★★★★★', type: '高危BOSS',
        area: '全城机动', tagline: '警惕的目光掠过每一处反光，指节在袖口下微微握紧',
        features: '战术反侦察 · 敏锐直觉 · 冲突专业格斗反制',
        windowNote: '日程四班三倒极难掌握，嗅觉敏锐，稍有不慎即遭反锁扣押',
        shoe: 'shoe_leather',
        stats: { str: 6, agi: 7, per: 8, nrv: 9 }, social: 4, alertMod: 15,
        status: 'ready'
      }
    }
  };
  const TARGET_NAME_POOL = {
    surnames: ['林', '沈', '苏', '顾', '陆', '姜', '叶', '白', '程', '温'],
    givenNames: [
      '幼微', '晚秋', '诗涵', '语棠', '凝雪', '沐晴', '芷若', '楚楚', '依诺', '佳宁',
      '晓夏', '念慈', '婉清', '昭华', '云舒', '梦瑶', '佩瑶', '希言', '凌薇', '心诺'
    ]
  };
  const TARGET_PERSONALITY_POOL = [
    { id: 'stubborn', name: '要强', label: '要强', type: 'personality', tagId: 'stubborn', category: 'conflict', value: 1, desc: '【性格·要强】自尊逞强，察觉异样快步不示弱，冲突对抗体格 +1' },
    { id: 'vigilant', name: '警惕', label: '警惕', type: 'personality', tagId: 'vigilant', category: 'acuity', value: 1, desc: '【性格·警惕】对异响直觉敏锐，有效敏锐暗修正 +1（警觉增量多4%，识脸率提升）' },
    { id: 'casual', name: '随性', label: '随性', type: 'personality', tagId: 'casual', category: 'stealth', value: 2, desc: '【性格·随性】随和散漫省事至上，沉浸自身节奏放空，对动静迟钝，玩家隐蔽 +2' },
    { id: 'timid', name: '胆小', label: '胆小', type: 'personality', tagId: 'timid', category: 'sound', value: -5, desc: '【性格·胆小】生性胆小怕事，受骇喉咙发紧呼救弱，动静声浪 -5，多选择避走' },
    { id: 'gentle', name: '温和', label: '温和', type: 'personality', tagId: 'gentle', category: 'conflict', value: -2, desc: '【性格·温和】性情温和避争端，受制易肢体僵滞，冲突首轮反抗战力 -2' },
    { id: 'introverted', name: '内向', label: '内向', type: 'personality', tagId: 'introverted', category: 'social', value: -2, desc: '【性格·内向】腼腆少言避生人，习惯低头独行避开视线，搭话与交涉检定修正 -2' },
    { id: 'aloof', name: '清冷', label: '清冷', type: 'personality', tagId: 'aloof', category: 'sound', value: -2, desc: '【性格·清冷】独来独往疏离冷淡，独行小道无接应，动静声浪初值 -2' },
    { id: 'cheerful', name: '开朗', label: '开朗', type: 'personality', tagId: 'cheerful', category: 'sound', value: 3, desc: '【性格·开朗】活泼外向精力充沛，遇险反应果断声线清亮，敢于呼救质问，声浪 +3' },
    { id: 'chic', name: '爱美', label: '爱美', type: 'personality', tagId: 'chic', category: 'stealth', value: 1, desc: '【性格·爱美】注重穿搭仪容，常在橱窗前驻足理衣理发，制造短暂停顿破绽，玩家接近 +1' },
    { id: 'naive', name: '单纯', label: '单纯', type: 'personality', tagId: 'naive', category: 'social', value: 2, desc: '【性格·单纯】心思简单缺少戒备，警惕建立慢，搭话与问路交涉修正 +2' }
  ];
  const TARGET_HOBBY_POOL = [
    { id: 'film_cafe', name: '胶片探店', label: '胶片探店', type: 'hobby', tagId: 'window_pause', category: 'stealth', value: 1, dropItem: 'item_retro_cam', desc: '【爱好·胶片探店】常在街角橱窗停顿取景，尾随近身检定 +1；随身带复古卡片机' },
    { id: 'indie_music', name: '大耳麦', label: '大耳麦', type: 'hobby', tagId: 'sound_muffled', category: 'stealth', value: 1, dropItem: 'item_headphone', desc: '【爱好·大耳麦】习惯戴大耳麦听歌，听觉迟钝，玩家隐蔽 +1，声浪阈值 -3；随身戴头戴耳麦' },
    { id: 'journal_craft', name: '手账', label: '手账', type: 'hobby', tagId: 'bag_rummage', category: 'stealth', value: 1, dropItem: 'item_handbook', desc: '【爱好·手账】常在路口驻足翻包找彩墨笔与票据，提供背身破绽窗口；随身带私密手账' },
    { id: 'night_run', name: '香氛', label: '香氛', type: 'hobby', tagId: 'aroma_trace', category: 'acuity', value: 0, dropItem: 'item_perfume', desc: '【爱好·香氛】慢跑更衣备有香氛小样，散发微香，近距离嗅觉识别线索；随身带香氛喷雾' },
    { id: 'book_tea', name: '旧书', label: '旧书', type: 'hobby', tagId: 'bag_heavy', category: 'conflict', value: -1, dropItem: 'item_old_book', desc: '【爱好·旧书】帆布包内压着借阅旧书，负重拖累，追逐奔跑敏捷对抗 -1；随身带借阅旧书' },
    { id: 'sketch_art', name: '速写', label: '速写', type: 'hobby', tagId: 'bench_still', category: 'stealth', value: 2, dropItem: 'item_sketchbook', desc: '【爱好·速写】常在路灯长椅静坐画街景，处于静止状态，尾随靠近免除移动检定；随身带水彩速写本' }
  ];
  const TARGET_SHOE_POOL = {
    student_and_college: [
      { id: 'shoe_sneakers', name: '运动鞋', label: '运动鞋', type: 'equipment', tagId: 'shoe_sneakers', desc: '【鞋具·运动鞋】软胶底球鞋，触地静音微抓地摩擦，驱动运动鞋脚步声' },
      { id: 'shoe_flats', name: '平底鞋', label: '平底鞋', type: 'equipment', tagId: 'shoe_flats', desc: '【鞋具·平底鞋】薄底平底单鞋，步履轻捷均匀，驱动平底鞋脚步声' },
      { id: 'shoe_leather', name: '小皮鞋', label: '小皮鞋', type: 'equipment', tagId: 'shoe_leather', desc: '【鞋具·小皮鞋】硬真皮底乐福鞋/校服单鞋，干练清脆，驱动小皮鞋脚步声' },
      { id: 'shoe_platform', name: '松糕鞋', label: '松糕鞋', type: 'equipment', tagId: 'shoe_platform', desc: '【鞋具·松糕鞋】厚底松糕鞋，钝重沉闷踏步，驱动松糕鞋脚步声' }
    ],
    defaults: {
      ol: { id: 'shoe_heel', name: '高跟鞋', label: '高跟鞋', type: 'equipment', tagId: 'shoe_heel', desc: '【鞋具·高跟鞋】细高跟鞋，步频清脆，跟钉敲击回响，驱动高跟鞋脚步声' },
      club: { id: 'shoe_boots', name: '靴子', label: '靴子', type: 'equipment', tagId: 'shoe_boots', desc: '【鞋具·靴子】重底皮革靴子，硬质厚重踏步声，驱动靴子脚步声' },
      wife: { id: 'shoe_slippers', name: '拖鞋', label: '拖鞋', type: 'equipment', tagId: 'shoe_slippers', desc: '【鞋具·拖鞋】居家拖鞋，啪嗒拖行声，驱动拖鞋脚步声' },
      police: { id: 'shoe_leather', name: '小皮鞋', label: '小皮鞋', type: 'equipment', tagId: 'shoe_leather', desc: '【鞋具·小皮鞋】便衣制式皮鞋，利落微硬，驱动小皮鞋脚步声' }
    }
  };
  const TARGET_STAT_DELTA_OPTIONS = [-1, 0, 1];

  function generateTargetPersona(tid) {
    const t = TARGET_DATA.list[tid] || TARGET_DATA.list.ol;
    const sIndex = Math.floor(Math.random() * TARGET_NAME_POOL.surnames.length);
    const gIndex = Math.floor(Math.random() * TARGET_NAME_POOL.givenNames.length);
    const surname = TARGET_NAME_POOL.surnames[sIndex];
    const givenName = TARGET_NAME_POOL.givenNames[gIndex];
    const name = surname + givenName;

    const pItem = TARGET_PERSONALITY_POOL[Math.floor(Math.random() * TARGET_PERSONALITY_POOL.length)];
    const hItem = TARGET_HOBBY_POOL[Math.floor(Math.random() * TARGET_HOBBY_POOL.length)];

    let shoeItem;
    if (t.id === 'college' || t.id === 'student') {
      const pool = TARGET_SHOE_POOL.student_and_college;
      shoeItem = pool[Math.floor(Math.random() * pool.length)];
    } else {
      shoeItem = TARGET_SHOE_POOL.defaults[t.id] || TARGET_SHOE_POOL.defaults.ol;
    }

    const deltas = {};
    const finalStats = {};
    const attrKeys = ['str', 'agi', 'per', 'nrv', 'social'];
    for (const k of attrKeys) {
      const base = k === 'social' ? (t.social || 2) : (t.stats[k] || 3);
      const d = TARGET_STAT_DELTA_OPTIONS[Math.floor(Math.random() * TARGET_STAT_DELTA_OPTIONS.length)];
      deltas[k] = d;
      finalStats[k] = Math.max(1, Math.min(10, base + d));
    }

    return {
      targetId: t.id,
      surname,
      givenName,
      name,
      personality: pItem.name,
      personalityId: pItem.id,
      personalityTag: pItem.tagId,
      personalityDesc: pItem.desc,
      hobby: hItem.name,
      hobbyId: hItem.id,
      hobbyTag: hItem.tagId,
      hobbyDesc: hItem.desc,
      shoeId: shoeItem.id,
      shoeName: shoeItem.name,
      shoeTag: shoeItem.tagId,
      shoeDesc: shoeItem.desc,
      deltas,
      finalStats
    };
  }


  const PRESETS = [
    { id: 'otaku',     label: '技术宅',   pts: { str: 2, agi: 3, nrv: 2, int: 7, cha: 6 }, note: '键盘后观察，镜头前结巴' },
    { id: 'coach',     label: '健身教练', pts: { str: 5, agi: 4, nrv: 5, int: 4, cha: 2 }, note: '一身力气，一张笨嘴' },
    { id: 'guard',     label: '退伍保安', pts: { str: 4, agi: 5, nrv: 6, int: 3, cha: 2 }, note: '胆壮体硬，眼嘴都笨' },
    { id: 'detective', label: '侦探学徒', pts: { str: 2, agi: 5, nrv: 4, int: 6, cha: 3 }, note: '均衡偏观察的跟单学徒' },
    { id: 'bartender', label: '夜场酒保', pts: { str: 2, agi: 4, nrv: 5, int: 4, cha: 5 }, note: '嘴皮子吃饭，夜路里泡大' }
  ];
  const ATTR_NAMES = { str: '体格', agi: '敏捷', nrv: '胆量', int: '情报', cha: '口才' };
  /* 档位人话（数值策划五维档位表直译：体格男性列＋其余四维） */
  const TIER = {
    str: ['病弱虚胖', '普通男性', '常干体力活', '重体力行当、退役兵', '职业力量运动员'],
    agi: ['反应慢半拍', '常人，打车追两步', '利落，人堆里钻得动', '练过短跑散打的脚步', '职业选手脚程'],
    nrv: ['惊弓鸟，容易僵住', '害怕但能喊能跑', '沉得住，夜路不慌', '老刑警的心脏', '泰山崩于前'],
    int: ['钥匙丢哪都不知道', '见大事漏细节', '心细，认脸过目七八成', '私家侦探，破绽难逃', '一个眼神读出小传'],
    cha: ['紧张就语无伦次', '寒暄可以，急了结巴', '会聊，话能圆回来', '律师主播级', '读心，演谁像谁']
  };
  const tierOf = (k, v) => TIER[k][v <= 2 ? 0 : v <= 4 ? 1 : v <= 6 ? 2 : v <= 8 ? 3 : 4];
  const POINT_BUDGET = 20;
  const ZERO = {
    step: 1,
    mode: null,
    identity: null,
    targetId: 'college',
    targetPersona: null,
    points: { str: 4, agi: 4, nrv: 4, int: 4, cha: 4 },
    done: false
  };
  const sumPts = () => Object.values(ZERO.points).reduce((a, b) => a + b, 0);
  const idDef = () => ZERO.identity ? IDENTITY_DATA.list[ZERO.identity] : null;

  function switchPane(name) {
    document.querySelectorAll('#wx-create-dialog .create-tab').forEach(t => t.classList.toggle('active', t.dataset.ctab === name));
    const quick = document.querySelector('[data-cpane="quick"]'), custom = document.querySelector('[data-cpane="custom"]');
    if (quick) quick.hidden = name !== 'quick';
    if (custom) custom.hidden = name !== 'custom';
  }

  function switchZeroStep(step) {
    if (step === 2) {
      if (!ZERO.identity || sumPts() !== POINT_BUDGET) return;
    }
    ZERO.step = step;
    const tab1 = document.getElementById('zeroStepTab1');
    const tab2 = document.getElementById('zeroStepTab2');
    const v1 = document.getElementById('zeroStep1');
    const v2 = document.getElementById('zeroStep2');
    if (tab1) {
      tab1.classList.toggle('active', step === 1);
      tab1.classList.toggle('completed', (!!ZERO.identity && sumPts() === POINT_BUDGET));
    }
    if (tab2) {
      tab2.classList.toggle('active', step === 2);
    }
    if (v1) v1.hidden = (step !== 1);
    if (v2) v2.hidden = (step !== 2);
    if (step === 2) {
      renderTargetGrid();
      updateTargetDetail(ZERO.targetId || 'college');
    }
  }

  function renderTargetGrid() {
    const grid = document.getElementById('targetGrid');
    if (!grid) return;
    if (!grid.dataset.built) {
      grid.dataset.built = '1';
      grid.innerHTML = Object.entries(TARGET_DATA.list).map(([id, t]) =>
        `<button type="button" class="target-card" data-tid="${id}">` +
        `<div class="target-head"><span class="target-name">${t.name}</span><span class="target-stars">${t.stars}</span></div>` +
        `<div class="target-meta-row"><span class="target-type-badge">${t.type}</span><span class="target-area">${t.area}</span></div>` +
        `<div class="target-tagline">“${t.tagline}”</div>` +
        `<div class="target-features">${t.features}</div>` +
        `</button>`
      ).join('');
      grid.querySelectorAll('[data-tid]').forEach(btn => {
        btn.addEventListener('click', () => {
          updateTargetDetail(btn.dataset.tid);
        });
      });
    }
    grid.querySelectorAll('[data-tid]').forEach(btn => {
      btn.classList.toggle('sel', btn.dataset.tid === (ZERO.targetId || 'college'));
    });
  }

  function updateTargetDetail(tid, forceReroll = false) {
    const t = TARGET_DATA.list[tid] || TARGET_DATA.list.college;
    ZERO.targetId = t.id;
    if (!ZERO.targetPersona || ZERO.targetPersona.targetId !== t.id || forceReroll) {
      ZERO.targetPersona = generateTargetPersona(t.id);
    }
    const persona = ZERO.targetPersona;
    const grid = document.getElementById('targetGrid');
    if (grid) {
      grid.querySelectorAll('[data-tid]').forEach(btn => btn.classList.toggle('sel', btn.dataset.tid === t.id));
    }
    const dName = document.getElementById('tDetailName');
    if (dName) dName.textContent = `${persona.name} · ${t.name}`;
    const dRealName = document.getElementById('tDetailRealName');
    if (dRealName) dRealName.textContent = persona.name;
    const dPersonality = document.getElementById('tDetailPersonality');
    if (dPersonality) {
      dPersonality.innerHTML = `<span class="tag personality" data-tip="${persona.personalityDesc || ''}">${persona.personality}</span>`;
    }
    const dHobby = document.getElementById('tDetailHobby');
    if (dHobby) {
      dHobby.innerHTML = `<span class="tag hobby" data-tip="${persona.hobbyDesc || ''}">${persona.hobby}</span>`;
    }
    const dShoe = document.getElementById('tDetailShoe');
    if (dShoe) {
      dShoe.innerHTML = `<span class="tag equipment" data-tip="${persona.shoeDesc || ''}">${persona.shoeName || '默认鞋具'}</span>`;
    }
    const dStars = document.getElementById('tDetailStars');
    if (dStars) dStars.textContent = t.stars;
    const dBadge = document.getElementById('tDetailBadge');
    if (dBadge) dBadge.textContent = t.type;
    const dStatus = document.getElementById('tDetailStatus');
    if (dStatus) {
      dStatus.textContent = t.id === 'ol' ? '完整动线生活包' : '标准动线 · 框架就绪';
    }
    const dArea = document.getElementById('tDetailArea');
    if (dArea) dArea.textContent = t.area;
    const dTagline = document.getElementById('tDetailTagline');
    if (dTagline) dTagline.textContent = t.tagline;
    const dFeat = document.getElementById('tDetailFeatures');
    if (dFeat) dFeat.textContent = t.features;
    const dWin = document.getElementById('tDetailWindow');
    if (dWin) dWin.textContent = t.windowNote;
    const dStats = document.getElementById('tDetailStats');
    if (dStats) {
      dStats.innerHTML = '体格 <b>？</b> · 敏捷 <b>？</b> · 敏锐 <b>？</b> · 胆量 <b>？</b> · 社交 <b>？</b> <small class="label" style="margin-left:6px">（情报迷雾 · 打量或调查后揭示）</small>';
    }
    const hint = document.getElementById('targetHint');
    if (hint) hint.textContent = `已锁定：${persona.name} · ${t.name}（${t.area}）`;
    const btn = document.getElementById('createConfirm');
    if (btn) btn.disabled = false;
  }

  function syncCreate() {
    /* 快捷预设页 */
    const quickPane = document.getElementById('quickPane');
    if (quickPane && !quickPane.dataset.built) {
      quickPane.dataset.built = '1';
      quickPane.innerHTML = '<div class="preset-grid">' + PRESETS.map(p =>
        `<button type="button" class="id-card preset" data-preset="${p.id}" data-tip="一键填入身份与推荐点数，落地后仍可微调">` +
        `<span class="id-name">${p.label}</span><span class="id-tagline">${p.note}</span>` +
        `<span class="id-line">体${p.pts.str} 敏${p.pts.agi} 胆${p.pts.nrv} 情${p.pts.int} 口${p.pts.cha} ＋${IDENTITY_DATA.list[p.id].name}身份修正</span></button>`).join('') + '</div>' +
        '<p class="label" style="margin-top:10px">五个老出身模板＝身份＋推荐点数的快捷方式；学生与罪犯在「自定义」页选。</p>';
      quickPane.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => {
        const p = PRESETS.find(x => x.id === b.dataset.preset);
        if (!p) return;
        ZERO.identity = p.id; ZERO.points = { ...p.pts };
        switchPane('custom'); syncCreate();
      }));
    }
    /* 身份七宫格 */
    const grid = document.getElementById('idGrid');
    if (grid && !grid.dataset.built) {
      grid.dataset.built = '1';
      grid.innerHTML = Object.entries(IDENTITY_DATA.list).map(([id, d]) =>
        `<button type="button" class="id-card" data-id="${id}"><span class="id-name">${d.name}</span>` +
        `<span class="id-tagline">${d.tagline}</span>` +
        `<span class="id-line">修正 <b>${Object.entries(d.mods).map(([k, v]) => ATTR_NAMES[k] + '+' + v).join(' ')}</b></span>` +
        `<span class="id-line"><b>特权</b>　${d.perk}</span>` +
        `<span class="id-line${d.flaw === '无' ? '' : ' bad'}"><b>${d.flaw === '无' ? '负面' : '负面'}</b>　${d.flaw}</span>` +
        `<span class="id-line"><b>工种</b>　${d.job}</span></button>`).join('');
      grid.querySelectorAll('[data-id]').forEach(b => b.addEventListener('click', () => { ZERO.identity = b.dataset.id; syncCreate(); }));
    }
    grid?.querySelectorAll('[data-id]').forEach(b => b.classList.toggle('sel', b.dataset.id === ZERO.identity));
    /* 分点行 */
    const rows = document.getElementById('allocRows');
    if (rows && !rows.dataset.built) {
      rows.dataset.built = '1';
      rows.innerHTML = Object.keys(ATTR_NAMES).map(k =>
        `<div class="alloc-row" data-k="${k}"><span class="alloc-name">${ATTR_NAMES[k]}</span>` +
        `<span class="stepper"><button type="button" data-step="-1" aria-label="${ATTR_NAMES[k]}减一">−</button>` +
        `<span class="alloc-val" data-val>4</span>` +
        `<button type="button" data-step="1" aria-label="${ATTR_NAMES[k]}加一">＋</button></span>` +
        `<span class="alloc-mod" data-mod>—</span><span class="alloc-tier" data-tier></span></div>`).join('');
      rows.querySelectorAll('.alloc-row').forEach(row => {
        const k = row.dataset.k;
        row.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => {
          const d = +b.dataset.step;
          const nv = ZERO.points[k] + d;
          if (nv < 1 || nv > 10 || (d > 0 && sumPts() >= POINT_BUDGET)) return;
          ZERO.points[k] = nv; syncCreate();
        }));
      });
    }
    if (rows) {
      let waste = 0;
      const def = idDef();
      rows.querySelectorAll('.alloc-row').forEach(row => {
        const k = row.dataset.k, v = ZERO.points[k], mod = def ? (def.mods[k] || 0) : 0;
        const eff = Math.min(10, v + mod);
        waste += Math.max(0, v + mod - 10);
        row.querySelector('[data-val]').textContent = v;
        const modEl = row.querySelector('[data-mod]');
        modEl.textContent = mod ? `${v}${mod > 0 ? '+' : ''}${mod}=${v + mod}${eff < v + mod ? '→' + eff : ''}` : '—';
        modEl.classList.toggle('waste', eff < v + mod);
        row.querySelector('[data-tier]').textContent = tierOf(k, eff);
      });
      const warnEl = document.getElementById('allocWarn');
      if (warnEl) warnEl.textContent = waste > 0 ? `身份修正溢出 10 封顶，将浪费 ${waste} 点——建议挪开` : '';
      const remain = POINT_BUDGET - sumPts();
      const remEl = document.getElementById('allocRemain');
      if (remEl) { remEl.textContent = remain === 0 ? '点数已分完 ✓' : `剩余 ${remain}`; remEl.classList.toggle('warn', remain > 0); }
    }
    /* 底部按钮与提示 */
    const ok = !!ZERO.identity && sumPts() === POINT_BUDGET;
    const nextBtn = document.getElementById('zeroNextStep');
    if (nextBtn) nextBtn.disabled = !ok;
    const tab2 = document.getElementById('zeroStepTab2');
    if (tab2) {
      tab2.style.cursor = ok ? 'pointer' : 'not-allowed';
      tab2.title = ok ? '进入步骤二：锁定目标' : '请先选定身份并分完 20 点';
    }
    const tab1 = document.getElementById('zeroStepTab1');
    if (tab1) tab1.classList.toggle('completed', ok);
    const hint = document.getElementById('createHint');
    if (hint) hint.textContent = !ZERO.identity ? '先选一个身份' : sumPts() !== POINT_BUDGET ? `还剩 ${POINT_BUDGET - sumPts()} 点没分` : `猎手就绪：${idDef().name} · ${Object.entries(ZERO.points).map(([k, v]) => ATTR_NAMES[k] + v).join(' ')}`;
  }

  function openCreate() {
    switchZeroStep(1);
    const d = document.getElementById('wx-create-dialog');
    if (d && !d.open) { if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', ''); }
    syncCreate();
  }

  function createConfirm() {
    if (!ZERO.identity || sumPts() !== POINT_BUDGET) return;
    const def = idDef();
    const targetDef = TARGET_DATA.list[ZERO.targetId || 'college'] || TARGET_DATA.list.college;
    const persona = ZERO.targetPersona;
    const init = {
      identity: ZERO.identity,
      targetId: ZERO.targetId || 'college',
      targetPersona: persona,
      player: { ...ZERO.points, staminaMax: 100 + (ZERO.points.str || 4) * 5 }
    };
    if (ZERO.mode === 'tavern') {
      const glue = (typeof globalThis !== 'undefined') && globalThis.WxGlue;
      if (!glue || !glue.newGame) {
        const hint = document.getElementById('targetHint') || document.getElementById('createHint');
        if (hint) hint.textContent = '引擎未就绪，稍等几秒再试';
        return;
      }
      ZERO.done = true;
      glue.newGame(init).catch(() => {});
    } else {
      ZERO.done = true;
      try { localStorage.setItem('wx_zero', JSON.stringify(init)); } catch (e) { /* 隐私模式等：仅本会话生效 */ }
      renderSnapshot({
        ...currentSnap,
        target: {
          ...currentSnap.target,
          id: targetDef.id,
          name: persona ? `${persona.name} · ${targetDef.name}` : targetDef.name,
          realName: persona ? persona.name : null,
          persona: persona || null
        },
        identity: { id: init.identity, name: def.name, shift: null, kit: null }
      });
    }
    document.getElementById('wx-create-dialog')?.close();
    updateZeroChip();
  }

  function updateIdBadge(snap) {
    const b = document.getElementById('idBadge');
    if (!b) return;
    const id = snap && snap.identity;
    if (id && id.name) {
      b.hidden = false;
      const d = IDENTITY_DATA.list[id.id];
      b.innerHTML = ico('person') + ' ' + id.name + (id.shift === 'night' ? ' · 夜班周' : id.shift === 'day' ? ' · 昼班周' : '');
      b.dataset.tip = d ? `${d.tagline}\n特权：${d.perk}\n负面：${d.flaw}\n工种：${d.job}` : '开局身份';
    } else b.hidden = true;
  }

  function updateZeroChip() {
    const c = document.getElementById('zeroChip');
    if (c) c.hidden = !!ZERO.done;
  }

  function openIdDetail() {
    const snapId = (currentSnap && currentSnap.identity) || null;
    const d = snapId ? IDENTITY_DATA.list[snapId.id] : null;
    const body = document.getElementById('idDetailBody');
    if (body) {
      body.innerHTML = !snapId ? '<p class="label">尚未开局（零楼未完成）。</p>' :
        `<p style="margin:0 0 6px;font-size:16px;font-weight:700">${d.name}</p>` +
        `<p class="label" style="font-style:italic">${d.tagline}</p>` +
        `<p class="id-line" style="font-size:13px"><b>特权</b>　${d.perk}</p>` +
        `<p class="id-line bad" style="font-size:13px"><b>负面</b>　${d.flaw}</p>` +
        `<p class="id-line" style="font-size:13px"><b>工种</b>　${d.job}</p>` +
        (snapId.shift ? `<p class="id-line" style="font-size:13px"><b>本周班次</b>　${snapId.shift === 'night' ? '夜班——今晚在岗，夜窗被占' : '昼班——白天在岗，夜窗自由'}</p>` : '') +
        (snapId.kit ? `<p class="id-line" style="font-size:13px"><b>随身</b>　针孔摄像机（存储档）</p>` : '');
    }
    const dlg = document.getElementById('wx-id-dialog');
    if (dlg && !dlg.open) { if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', ''); }
  }

  async function resetZero() {
    if (!window.confirm('重开新局？当前进度将清空，回到零楼重新选身份与目标。')) return;
    ZERO.done = false; ZERO.step = 1; ZERO.identity = null; ZERO.targetId = 'college';
    ZERO.targetPersona = null;
    ZERO.points = { str: 4, agi: 4, nrv: 4, int: 4, cha: 4 };
    try { localStorage.removeItem('wx_zero'); } catch (e) {}
    if (ZERO.mode === 'tavern') {
      const glue = (typeof globalThis !== 'undefined') && globalThis.WxGlue;
      if (glue && glue.resetGame) { try { await glue.resetGame(); } catch (e) {} }
    }
    document.getElementById('wx-id-dialog')?.close();
    updateIdBadge(null);   // 徽记随局清空，不留旧身份残影
    if (ZERO.mode === 'demo') renderSnapshot({ ...currentSnap, identity: null });
    updateZeroChip();
    openCreate();
  }

  document.querySelectorAll('#wx-create-dialog .create-tab').forEach(t => t.addEventListener('click', () => switchPane(t.dataset.ctab)));
  document.getElementById('zeroChip')?.addEventListener('click', openCreate);
  document.getElementById('idBadge')?.addEventListener('click', openIdDetail);
  document.getElementById('zeroNextStep')?.addEventListener('click', () => switchZeroStep(2));
  document.getElementById('zeroPrevStep')?.addEventListener('click', () => switchZeroStep(1));
  document.getElementById('zeroStepTab1')?.addEventListener('click', () => switchZeroStep(1));
  document.getElementById('zeroStepTab2')?.addEventListener('click', () => {
    if (!!ZERO.identity && sumPts() === POINT_BUDGET) switchZeroStep(2);
  });
  document.getElementById('tDetailReroll')?.addEventListener('click', () => {
    updateTargetDetail(ZERO.targetId || 'college', true);
  });
  document.getElementById('createConfirm')?.addEventListener('click', createConfirm);
  document.getElementById('idResetBtn')?.addEventListener('click', () => { resetZero(); });

  /* 零楼初始化：真机（有酒馆变量 API）查 wx_save 定新局；本地演示查 localStorage */
  (async function zeroFloorInit() {
    const holder = (typeof getVariables === 'function') ? globalThis
      : (globalThis.TavernHelper && globalThis.TavernHelper.getVariables ? globalThis.TavernHelper : null);
    if (holder) {
      ZERO.mode = 'tavern';
      try {
        const v = await holder.getVariables({ type: 'chat' });
        const hasSave = v && v.wx_save && v.wx_save.v === 1;
        ZERO.done = !!hasSave;              // 有档＝续局，不弹零楼
        if (!hasSave) openCreate();
      } catch (e) { openCreate(); }
    } else {
      ZERO.mode = 'demo';
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem('wx_zero') || 'null'); } catch (e) {}
      if (saved && saved.identity && IDENTITY_DATA.list[saved.identity]) {
        ZERO.done = true;
        ZERO.identity = saved.identity;
        ZERO.targetId = saved.targetId || 'college';
        ZERO.targetPersona = saved.targetPersona || null;
        if (saved.player) ZERO.points = { ...saved.player };
        const tDef = TARGET_DATA.list[ZERO.targetId] || TARGET_DATA.list.college;
        const p = ZERO.targetPersona;
        renderSnapshot({
          ...currentSnap,
          target: {
            ...currentSnap.target,
            id: tDef.id,
            name: p ? `${p.name} · ${tDef.name}` : tDef.name,
            realName: p ? p.name : null,
            persona: p || null
          },
          identity: { id: saved.identity, name: IDENTITY_DATA.list[saved.identity].name, shift: null, kit: null }
        });
      } else openCreate();
    }
    updateZeroChip();
  })();

  /* ═══ M4-2 三翼战术 Canvas 判定台引擎（三翼因果流动 ⇄ 3D物理晶体d20 ⇄ 即时账目与暗账揭秘） ═══ */
  const SETTLE = { auto: false };
  const SETTLE_BAND_CN = { success: '成功', grace: '勉强过关', fail: '检定失败', nat1: '大失败', nat20: '大成功' };
  const SETTLE_ACC_CN = { stamina: '体力消耗', heart: '心跳进账', alert: '警觉变动', pi: 'PI情报', proximity: '接近度推进', cash: '现金' };

  /* 1. 向量与四元数轻量数学核心 */
  const V_3D = {
    sub: (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]],
    add: (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]],
    mul: (a, s) => [a[0]*s, a[1]*s, a[2]*s],
    dot: (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2],
    cross: (a, b) => [
      a[1]*b[2] - a[2]*b[1],
      a[2]*b[0] - a[0]*b[2],
      a[0]*b[1] - a[1]*b[0]
    ],
    len: a => Math.hypot(a[0], a[1], a[2]),
    norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; }
  };

  const Q_3D = {
    id: () => [0, 0, 0, 1],
    norm: q => {
      const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
      return [q[0]/l, q[1]/l, q[2]/l, q[3]/l];
    },
    fromAxis: (ax, ang) => {
      const s = Math.sin(ang / 2);
      return [ax[0]*s, ax[1]*s, ax[2]*s, Math.cos(ang/2)];
    },
    mul: (a, b) => [
      a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1],
      a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0],
      a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3],
      a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2]
    ],
    rotateVec: (q, v) => {
      const qv = [q[0], q[1], q[2]], qw = q[3];
      const t = V_3D.mul(V_3D.cross(qv, v), 2);
      return V_3D.add(V_3D.add(v, V_3D.mul(t, qw)), V_3D.cross(qv, t));
    },
    fromToVec: (vFrom, vTo) => {
      const from = V_3D.norm(vFrom), to = V_3D.norm(vTo);
      const d = V_3D.dot(from, to);
      if (d >= 0.999999) return [0, 0, 0, 1];
      if (d <= -0.999999) {
        let axis = V_3D.cross([1, 0, 0], from);
        if (V_3D.len(axis) < 0.001) axis = V_3D.cross([0, 1, 0], from);
        axis = V_3D.norm(axis);
        return [axis[0], axis[1], axis[2], 0];
      }
      const c = V_3D.cross(from, to);
      const s = Math.sqrt((1 + d) * 2);
      return [c[0] / s, c[1] / s, c[2] / s, s / 2];
    },
    slerp: (a, b, t) => {
      let d = a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
      let bb = b;
      if (d < 0) { bb = [-b[0], -b[1], -b[2], -b[3]]; d = -d; }
      if (d > 0.9995) {
        return Q_3D.norm([
          a[0] + (bb[0]-a[0])*t,
          a[1] + (bb[1]-a[1])*t,
          a[2] + (bb[2]-a[2])*t,
          a[3] + (bb[3]-a[3])*t
        ]);
      }
      const th = Math.acos(Math.min(1, Math.max(-1, d)));
      const s = Math.sin(th);
      const wa = Math.sin((1-t)*th) / s, wb = Math.sin(t*th) / s;
      return [
        a[0]*wa + bb[0]*wb,
        a[1]*wa + bb[1]*wb,
        a[2]*wa + bb[2]*wb,
        a[3]*wa + bb[3]*wb
      ];
    }
  };

  /* 2. 正二十面体几何建模 */
  function buildIcosahedron() {
    const phi = (1 + Math.sqrt(5)) / 2;
    const rawVerts = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];
    const verts = rawVerts.map(V_3D.norm);
    const EDGE = 2 / Math.hypot(1, phi);

    const faces = [];
    for (let i = 0; i < 12; i++) {
      for (let j = i + 1; j < 12; j++) {
        for (let k = j + 1; k < 12; k++) {
          const d_ij = Math.abs(V_3D.len(V_3D.sub(verts[i], verts[j])) - EDGE);
          const d_jk = Math.abs(V_3D.len(V_3D.sub(verts[j], verts[k])) - EDGE);
          const d_ki = Math.abs(V_3D.len(V_3D.sub(verts[k], verts[i])) - EDGE);
          if (d_ij < 1e-4 && d_jk < 1e-4 && d_ki < 1e-4) {
            const c = V_3D.mul(V_3D.add(V_3D.add(verts[i], verts[j]), verts[k]), 1/3);
            let n = V_3D.cross(V_3D.sub(verts[j], verts[i]), V_3D.sub(verts[k], verts[i]));
            if (V_3D.dot(n, c) < 0) faces.push([i, k, j]);
            else faces.push([i, j, k]);
          }
        }
      }
    }

    const faceObjs = faces.map((indices, idx) => {
      const v0 = verts[indices[0]], v1 = verts[indices[1]], v2 = verts[indices[2]];
      const center = V_3D.norm(V_3D.mul(V_3D.add(V_3D.add(v0, v1), v2), 1/3));
      const u = V_3D.norm(V_3D.sub(v0, V_3D.mul(center, V_3D.dot(v0, center))));
      const w = V_3D.cross(center, u);
      return { idx, indices, center, n: center, u, w, value: 0 };
    });

    const paired = [];
    const used = new Set();
    for (let i = 0; i < faceObjs.length; i++) {
      if (used.has(i)) continue;
      let oppIdx = -1, minDot = 1;
      for (let j = i + 1; j < faceObjs.length; j++) {
        if (used.has(j)) continue;
        const dot = V_3D.dot(faceObjs[i].center, faceObjs[j].center);
        if (dot < minDot) { minDot = dot; oppIdx = j; }
      }
      if (oppIdx !== -1) {
        paired.push([i, oppIdx]);
        used.add(i); used.add(oppIdx);
      }
    }

    const VAL_PAIRS = [
      [20, 1], [14, 7], [18, 3], [12, 9], [16, 5],
      [19, 2], [13, 8], [17, 4], [11, 10], [15, 6]
    ];
    paired.forEach((p, idx) => {
      const [vA, vB] = VAL_PAIRS[idx % VAL_PAIRS.length];
      faceObjs[p[0]].value = vA;
      faceObjs[p[1]].value = vB;
    });

    return { verts, faces: faceObjs };
  }

  const SETTLE_GEO = buildIcosahedron();

  function getFaceTargetQuat(face) {
    const q1 = Q_3D.fromToVec(face.n, [0, 0, 1]);
    const uRot = Q_3D.rotateVec(q1, face.u);
    const currentAngle = Math.atan2(uRot[0], -uRot[1]);
    const q2 = Q_3D.fromAxis([0, 0, 1], -currentAngle);
    return Q_3D.mul(q2, q1);
  }

  /* 3. 专属 Web Audio 物理触感合成器 */
  let settleAudioCtx = null;
  function getSettleAudio() {
    if (typeof audioContext !== 'undefined' && audioContext && audioContext.state === 'running') {
      return audioContext;
    }
    try {
      if (!settleAudioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) settleAudioCtx = new AC();
      }
      if (settleAudioCtx && settleAudioCtx.state === 'suspended') {
        settleAudioCtx.resume();
      }
      return settleAudioCtx;
    } catch (e) {
      return null;
    }
  }

  function playTickSound(vol = 0.035, pitch = 700) {
    const ctx = getSettleAudio(); if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  }

  function playChipSound(isHidden = false) {
    const ctx = getSettleAudio(); if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const f0 = isHidden ? 380 : 880;
      osc.type = isHidden ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(f0, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(f0 * 1.25, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.07);
    } catch (e) {}
  }

  function playCritSuccessSound() {
    const ctx = getSettleAudio(); if (!ctx) return;
    try {
      const notes = [1046.5, 1318.5, 1567.9, 2093.0];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.055;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.015, startTime + 0.35);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.65);

        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(startTime); osc.stop(startTime + 0.7);
      });
    } catch (e) {}
  }

  function playCritFailSound() {
    const ctx = getSettleAudio(); if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(145, t0);
      subOsc.frequency.exponentialRampToValueAtTime(32, t0 + 0.45);
      subGain.gain.setValueAtTime(0.25, t0);
      subGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
      subOsc.connect(subGain); subGain.connect(ctx.destination);
      subOsc.start(t0); subOsc.stop(t0 + 0.6);

      [174.6, 185.0].forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t0 + 0.03);
        gain.gain.setValueAtTime(0.08, t0 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.48);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t0 + 0.03); osc.stop(t0 + 0.5);
      });
    } catch (e) {}
  }

  function playSuccessSound() {
    const ctx = getSettleAudio(); if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.3, t0);
      osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.16);
      gain.gain.setValueAtTime(0.12, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + 0.28);
    } catch (e) {}
  }

  function playNormalSound(isGrace) {
    const ctx = getSettleAudio(); if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isGrace ? 'triangle' : 'sawtooth';
      const f0 = isGrace ? 440 : 260;
      osc.frequency.setValueAtTime(f0, t0);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.7, t0 + 0.18);
      gain.gain.setValueAtTime(0.10, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + 0.25);
    } catch (e) {}
  }

  /* 4. 渲染管线与状态机 */
  let settleCanvas = null;
  let settleCtx = null;
  let settleCurQuat = Q_3D.id();
  let settleAngularVel = [0.03, 0.04, 0.02];
  let settleRollState = 'IDLE';
  let settleTargetVal = 14;
  let settleTargetFace = null;
  let settleAlignStartQuat = null;
  let settleAlignTargetQuat = null;
  let settleAlignProgress = 0;
  let settleBounceHeight = 0;
  let settleBounceT = 0;
  let settleAnimId = null;
  let settleLastTime = performance.now();
  let settleQueueResolve = null;
  let settleCurrentAction = null;
  let settleIsDragging = false;
  let settleLastMouse = [0, 0];

  const SETTLE_THEME = {
    faceFillA: '#151d2a', faceFillB: '#0a0e16',
    edgeStroke: 'rgba(80, 140, 210, 0.45)', edgeWidth: 1.8,
    frontEdgeGlow: 'rgba(100, 180, 255, 0.85)',
    textColor: '#8eb6e6', textLit: '#ffffff',
    specularPow: 14
  };
  const SETTLE_LIGHT = V_3D.norm([0.4, -0.8, 1.2]);

  function renderSettleCanvas() {
    if (!settleCanvas) {
      settleCanvas = document.getElementById('settleDieCanvas');
      if (settleCanvas) settleCtx = settleCanvas.getContext('2d');
    }
    if (!settleCtx) return;

    const W = settleCanvas.width, H = settleCanvas.height;
    const RADIUS = 155;
    settleCtx.clearRect(0, 0, W, H);

    const transVerts = SETTLE_GEO.verts.map(v => {
      const r = Q_3D.rotateVec(settleCurQuat, v);
      const zScale = 1 + r[2] * 0.18;
      const x = W / 2 + r[0] * RADIUS * zScale;
      const y = (H / 2 - settleBounceHeight) + r[1] * RADIUS * zScale;
      return { x, y, z: r[2], orig: v };
    });

    const sortedFaces = SETTLE_GEO.faces.map(f => {
      const rotatedCenter = Q_3D.rotateVec(settleCurQuat, f.center);
      const rotatedNorm = Q_3D.rotateVec(settleCurQuat, f.n);
      return {
        face: f,
        z: rotatedCenter[2],
        center2d: {
          x: W / 2 + rotatedCenter[0] * RADIUS,
          y: (H / 2 - settleBounceHeight) + rotatedCenter[1] * RADIUS
        },
        norm: rotatedNorm,
        isFront: rotatedNorm[2] > 0.05
      };
    }).sort((a, b) => a.z - b.z);

    sortedFaces.forEach(sf => {
      const f = sf.face;
      const pts = f.indices.map(idx => transVerts[idx]);
      const norm = sf.norm;
      const isFront = sf.isFront;

      if (!isFront) return;

      const diff = Math.max(0, V_3D.dot(norm, SETTLE_LIGHT));
      const halfV = V_3D.norm(V_3D.add(SETTLE_LIGHT, [0, 0, 1]));
      const spec = Math.pow(Math.max(0, V_3D.dot(norm, halfV)), SETTLE_THEME.specularPow);

      settleCtx.beginPath();
      settleCtx.moveTo(pts[0].x, pts[0].y);
      settleCtx.lineTo(pts[1].x, pts[1].y);
      settleCtx.lineTo(pts[2].x, pts[2].y);
      settleCtx.closePath();

      const isTargetCenter = ((settleRollState === 'SETTLED' || settleRollState === 'BOUNCING') && f.value === settleTargetVal && norm[2] > 0.90);

      if (isTargetCenter) {
        settleCtx.fillStyle = (settleTargetVal === 20) ? '#282012' : (settleTargetVal === 1) ? '#2a1116' : '#142030';
      } else {
        settleCtx.fillStyle = SETTLE_THEME.faceFillA;
      }
      settleCtx.fill();

      settleCtx.fillStyle = `rgba(255,255,255,${(diff * 0.15 + spec * 0.35).toFixed(3)})`;
      settleCtx.fill();

      if (isTargetCenter) {
        settleCtx.save();
        settleCtx.strokeStyle = (settleTargetVal === 20) ? '#ffe699' : (settleTargetVal === 1) ? '#ff8a9c' : '#7fe3d4';
        settleCtx.lineWidth = 4;
        settleCtx.shadowColor = settleCtx.strokeStyle;
        settleCtx.shadowBlur = 18;
        settleCtx.stroke();
        settleCtx.restore();
      } else {
        settleCtx.strokeStyle = SETTLE_THEME.edgeStroke;
        settleCtx.lineWidth = SETTLE_THEME.edgeWidth;
        settleCtx.stroke();
      }

      if (norm[2] > 0.28) {
        settleCtx.save();
        settleCtx.translate(sf.center2d.x, sf.center2d.y);

        const rotatedU = Q_3D.rotateVec(settleCurQuat, f.u);
        const ang = Math.atan2(rotatedU[0], -rotatedU[1]);
        settleCtx.rotate(ang);

        if (isTargetCenter) {
          settleCtx.font = '900 36px Consolas, monospace';
          settleCtx.textAlign = 'center';
          settleCtx.textBaseline = 'middle';

          if (settleTargetVal === 20) {
            settleCtx.fillStyle = '#fff9e6';
            settleCtx.shadowColor = '#ffd700';
            settleCtx.shadowBlur = 24;
          } else if (settleTargetVal === 1) {
            settleCtx.fillStyle = '#ffd6dc';
            settleCtx.shadowColor = '#ff385c';
            settleCtx.shadowBlur = 24;
          } else {
            settleCtx.fillStyle = '#ffffff';
            settleCtx.shadowColor = SETTLE_THEME.frontEdgeGlow;
            settleCtx.shadowBlur = 18;
          }
        } else {
          const scale = Math.max(0.4, norm[2]);
          settleCtx.scale(scale, scale);
          settleCtx.font = '700 22px Consolas, monospace';
          settleCtx.textAlign = 'center';
          settleCtx.textBaseline = 'middle';
          settleCtx.fillStyle = SETTLE_THEME.textColor;
        }

        settleCtx.fillText(String(f.value), 0, 0);
        settleCtx.restore();
      }
    });
  }

  function animateSettle(now) {
    const dt = Math.min(32, now - settleLastTime) / 1000;
    settleLastTime = now;

    const shadowEl = document.getElementById('settleDieShadow');

    if (settleRollState === 'SUSTAINED') {
      const speed = Math.hypot(...settleAngularVel);
      if (speed > 0.001) {
        const axis = V_3D.norm(settleAngularVel);
        const dq = Q_3D.fromAxis(axis, speed);
        settleCurQuat = Q_3D.mul(settleCurQuat, dq);
      }
      settleBounceHeight = Math.abs(Math.sin(now * 0.018)) * 14;
      if (shadowEl) shadowEl.style.transform = `scale(${1 - settleBounceHeight * 0.006})`;
      if (Math.random() < 0.25) playTickSound(0.035, 350 + Math.random() * 450);

    } else if (settleRollState === 'DAMPING') {
      const speed = Math.hypot(...settleAngularVel);
      if (speed > 0.001) {
        const axis = V_3D.norm(settleAngularVel);
        const dq = Q_3D.fromAxis(axis, speed);
        settleCurQuat = Q_3D.mul(settleCurQuat, dq);
      }
      settleAngularVel = V_3D.mul(settleAngularVel, 0.955);
      settleBounceHeight = Math.abs(Math.sin(now * 0.015)) * (speed * 75);
      if (shadowEl) shadowEl.style.transform = `scale(${1 - settleBounceHeight * 0.006})`;
      if (Math.random() < 0.20 && speed > 0.06) playTickSound(0.04, 250 + Math.random() * 300);

      if (speed < 0.075) {
        settleRollState = 'ALIGNING';
        settleAlignStartQuat = settleCurQuat;
        settleAlignTargetQuat = getFaceTargetQuat(settleTargetFace);
        settleAlignProgress = 0;
      }
    } else if (settleRollState === 'ALIGNING') {
      settleAlignProgress += dt * 3.4;
      if (settleAlignProgress >= 1) {
        settleCurQuat = settleAlignTargetQuat;
        settleRollState = 'BOUNCING';
        settleBounceT = 0;
      } else {
        const t = 1 - Math.pow(1 - settleAlignProgress, 3);
        settleCurQuat = Q_3D.slerp(settleAlignStartQuat, settleAlignTargetQuat, t);
        settleBounceHeight = Math.sin((1 - settleAlignProgress) * Math.PI) * 12;
        if (shadowEl) shadowEl.style.transform = `scale(${1 - settleBounceHeight * 0.006})`;
      }
    } else if (settleRollState === 'BOUNCING') {
      settleBounceT += dt;
      settleBounceHeight = Math.max(0, Math.sin(settleBounceT * 26) * Math.exp(-settleBounceT * 10) * 10);
      if (shadowEl) shadowEl.style.transform = `scale(${1 - settleBounceHeight * 0.005})`;

      if (settleBounceT > 0.32) {
        settleRollState = 'SETTLED';
        settleBounceHeight = 0;
        if (shadowEl) shadowEl.style.transform = 'scale(1)';
        onSettleSettled();
      }
    }

    renderSettleCanvas();
    if (settleRollState !== 'IDLE') {
      settleAnimId = requestAnimationFrame(animateSettle);
    }
  }

  function stopSettleAnimation() {
    if (settleAnimId) {
      cancelAnimationFrame(settleAnimId);
      settleAnimId = null;
    }
    settleRollState = 'IDLE';
  }

  function onSettleSettled() {
    const act = settleCurrentAction;
    if (!act) return;
    const isNat20 = settleTargetVal === 20;
    const isNat1 = settleTargetVal === 1;
    const isFail = act.band === 'fail' || isNat1;
    const isGrace = act.band === 'grace';
    const isCrit = act.band === 'crit' || act.band === 'nat20' || isNat20;

    if (isCrit) playCritSuccessSound();
    else if (isNat1) playCritFailSound();
    else if (act.band === 'success') playSuccessSound();
    else playNormalSound(isGrace);

    const stage = document.getElementById('settleConsole');
    const vBadge = document.getElementById('settleVerdictBadge');
    const mathLine = document.getElementById('settleMathLine');
    const flash = document.getElementById('settleFlashOverlay');
    const hud = document.getElementById('settleHudStatus');
    const ledgerWrap = document.getElementById('settleLedgerWrap');
    const darkCard = document.getElementById('settleDarkRevealCard');

    let bandClass = 'success', verdictTxt = '成 功';
    if (isCrit) {
      bandClass = 'crit'; verdictTxt = '大 成 功';
      stage?.classList.add('shake-crit');
    } else if (isNat1) {
      bandClass = 'fail'; verdictTxt = '大 失 败';
      stage?.classList.add('shake-fail');
    } else if (isFail) {
      bandClass = 'fail'; verdictTxt = '检 定 失 败';
      stage?.classList.add('shake-fail');
    } else if (isGrace) {
      bandClass = 'grace'; verdictTxt = '勉 强 过 关';
    }

    if (stage) stage.className = `stage-console settled ${bandClass}`;
    if (vBadge) {
      vBadge.textContent = `${settleTargetVal} · ${verdictTxt}`;
      vBadge.className = `verdict-badge show ${bandClass}`;
    }

    if (flash) flash.className = `flash-overlay ${bandClass === 'fail' ? 'bad' : bandClass === 'crit' ? 'crit' : 'ok'}`;

    const totalMod = (act.mods || []).reduce((s, m) => s + (m.v || 0), 0) + (act.attr ? act.attr.v : 0);
    const finalScore = act.total ?? (settleTargetVal + totalMod);
    if (mathLine) mathLine.innerHTML = `1d20(<b>${settleTargetVal}</b>) +${totalMod}修正 = <b>${finalScore}</b> vs DC ${act.dc}`;

    const ledgerItems = [];
    if (act.ledger && act.ledger.applied) {
      const aMap = { proximity: '接近度推进', heart: '心跳进账', alert: '警觉变动', stamina: '体力消耗', pi: 'PI情报' };
      for (const [k, v] of Object.entries(act.ledger.applied)) {
        if (!v) continue;
        const isWarn = (k === 'stamina' && v < 0) || (k === 'heart' && v > 0) || (k === 'alert' && v > 0);
        const isGain = (k === 'proximity' && v > 0) || (k === 'pi' && v > 0);
        ledgerItems.push({
          label: aMap[k] || k,
          val: `${v > 0 ? '+' : ''}${v}`,
          type: isWarn ? 'warn' : isGain ? 'gain' : ''
        });
      }
    }
    if (act.pkgAccount) {
      const acc = act.pkgAccount;
      if (ledgerItems.length === 0) {
        if (acc.proximity) ledgerItems.push({ label: '接近度推进', val: `${acc.proximity > 0 ? '+' : ''}${acc.proximity}`, type: acc.proximity > 0 ? 'gain' : '' });
        if (acc.heart) ledgerItems.push({ label: '心跳净增', val: `${acc.heart > 0 ? '+' : ''}${acc.heart} bpm`, type: acc.heart > 0 ? 'warn' : 'gain' });
        if (acc.alert) ledgerItems.push({ label: '警觉变动', val: `${acc.alert > 0 ? '+' : ''}${acc.alert}`, type: acc.alert > 0 ? 'warn' : 'gain' });
        if (acc.stamina) ledgerItems.push({ label: '体力开支', val: `${acc.stamina}`, type: acc.stamina < 0 ? 'warn' : 'gain' });
        if (acc.pi) ledgerItems.push({ label: 'PI情报收益', val: `+${acc.pi}`, type: 'gain' });
      }
    }
    if (act.pkgSeg && act.pkgSeg.staminaTax) {
      const taxVal = Number(act.pkgSeg.staminaTax);
      ledgerItems.push({ label: '体力段位税', val: `${taxVal > 0 ? '-' + taxVal : taxVal}`, type: 'warn' });
    }
    if (ledgerItems.length === 0) {
      ledgerItems.push({ label: '态势账目', val: '平衡维持', type: '' });
    }

    if (ledgerWrap) {
      ledgerWrap.innerHTML = '';
      ledgerItems.forEach((item, lIdx) => {
        setTimeout(() => {
          const row = document.createElement('div');
          row.className = `ledger-row ${item.type || ''}`;
          row.innerHTML = `<span>${item.label}</span><span class="val">${item.val}</span>`;
          ledgerWrap.appendChild(row);
          requestAnimationFrame(() => row.classList.add('show'));
        }, lIdx * 65);
      });
    }

    if (act.darkReveal && darkCard) {
      setTimeout(() => {
        darkCard.innerHTML = `<b>[暗账揭秘]</b> ${act.darkReveal}`;
        darkCard.classList.add('show');
      }, 300);
    }

    if (hud) hud.textContent = `RESULT LOCKED: [ ${settleTargetVal} ] · CHECK FINISHED`;

    if (typeof settleQueueResolve === 'function') {
      const res = settleQueueResolve;
      settleQueueResolve = null;
      res();
    }
  }

  function playOneSettleAction(act, idx, totalCount, account, seg) {
    return new Promise(resolve => {
      settleQueueResolve = resolve;
      act.pkgAccount = account;
      act.pkgSeg = seg;
      settleCurrentAction = act;
      settleTargetVal = act.d20 || 10;
      settleTargetFace = SETTLE_GEO.faces.find(f => f.value === settleTargetVal) || SETTLE_GEO.faces[0];

      const stage = document.getElementById('settleConsole');
      if (stage) stage.className = 'stage-console';

      settleAngularVel = [
        (Math.random() - 0.5) * 0.5 + 0.35,
        (Math.random() - 0.5) * 0.5 + 0.35,
        (Math.random() - 0.5) * 0.4
      ];
      settleRollState = 'SUSTAINED';

      const badge = document.getElementById('settleActBadge');
      if (badge) badge.textContent = `▸ ${act.label || act.name}`;
      const modsStack = document.getElementById('settleModsStack');
      if (modsStack) modsStack.innerHTML = '';

      const ekgHeart = document.getElementById('settleEkgHeart');
      if (ekgHeart) {
        const bpm = (typeof currentHeart !== 'undefined') ? heartToBpm(currentHeart) : 58;
        ekgHeart.textContent = `${bpm} BPM · 甜区`;
      }

      const vBadge = document.getElementById('settleVerdictBadge');
      if (vBadge) {
        vBadge.className = 'verdict-badge';
        vBadge.textContent = '测算中 …';
      }
      const mathLine = document.getElementById('settleMathLine');
      if (mathLine) mathLine.textContent = '—';
      const ledgerWrap = document.getElementById('settleLedgerWrap');
      if (ledgerWrap) ledgerWrap.innerHTML = '<div class="ledger-row show"><span>筹码注入中，等待定格 …</span></div>';
      
      const darkCard = document.getElementById('settleDarkRevealCard');
      if (darkCard) {
        darkCard.className = 'dark-reveal-card';
        darkCard.innerHTML = '';
      }

      const hud = document.getElementById('settleHudStatus');
      if (hud) {
        hud.textContent = totalCount > 1
          ? `[ 判定 ${idx + 1}/${totalCount} ] · INJECTING MODIFIERS …`
          : 'INJECTING MODIFIERS …';
      }

      playTickSound(0.08, 600);

      const chipList = [];
      if (act.attr) {
        chipList.push({ name: `${act.attr.name}属性`, v: act.attr.v });
      }
      for (const m of (act.mods || [])) {
        chipList.push({ name: m.name || m.src || '修正', v: m.v, ripple: m.ripple });
      }
      if (act.targetMod && act.targetMod !== 0) {
        chipList.push({ name: '她的暗账 ??', v: act.targetMod, hidden: true });
      } else if (act.darkReveal) {
        chipList.push({ name: '目标防备 ??', v: 0, hidden: true });
      }

      const CHIP_GAP = 320;
      const START_T = 260;

      chipList.forEach((m, mIdx) => {
        setTimeout(() => {
          if (settleRollState !== 'SUSTAINED') return;
          const chip = document.createElement('div');
          chip.className = 'chip-item' + (m.hidden ? ' hidden-mod' : '') + (m.ripple ? ' ripple-mod' : '');
          chip.innerHTML = `<span>${m.name}</span><b>${m.v >= 0 ? '+' : ''}${m.v}</b>`;
          if (modsStack) modsStack.appendChild(chip);
          playChipSound(m.hidden);
        }, START_T + mIdx * CHIP_GAP);
      });

      const totalInjectTime = START_T + chipList.length * CHIP_GAP + 240;
      setTimeout(() => {
        if (settleRollState === 'SUSTAINED') {
          if (hud) {
            hud.textContent = totalCount > 1
              ? `[ 判定 ${idx + 1}/${totalCount} ] · MODIFIERS LOCKED · DECELERATING …`
              : 'MODIFIERS LOCKED · DECELERATING …';
          }
          settleRollState = 'DAMPING';
        }
      }, totalInjectTime);
    });
  }

  async function runSettleQueue(actions, account, seg) {
    const qHistory = document.getElementById('settleQueueHistory');
    if (qHistory) {
      qHistory.innerHTML = '';
      qHistory.style.display = actions.length > 1 ? 'flex' : 'none';
    }

    settleLastTime = performance.now();
    if (!settleAnimId) {
      settleAnimId = requestAnimationFrame(animateSettle);
    }

    for (let i = 0; i < actions.length; i++) {
      await playOneSettleAction(actions[i], i, actions.length, account, seg);

      if (actions.length > 1 && qHistory) {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `<span>[${i+1}/${actions.length}] ${actions[i].name}</span><b>${actions[i].d20} · ${SETTLE_BAND_CN[actions[i].band] || actions[i].band}</b>`;
        qHistory.appendChild(item);
      }

      if (i < actions.length - 1) {
        await new Promise(r => setTimeout(r, 1200));
      }
    }
  }

  let _lastSettlePkgFloor = -1;
  let _lastSettleTime = 0;
  function showSettle(pkg) {
    if (SETTLE.auto) { console.log('[M4][状态栏] 自动掷开启，跳过面板'); return; }
    if (!pkg) return;
    const now = performance.now();
    if (pkg.floor != null && pkg.floor === _lastSettlePkgFloor && (now - _lastSettleTime < 1000)) {
      console.log('[M4][状态栏] 重复结算包防抖拦截：楼', pkg.floor);
      return;
    }
    _lastSettlePkgFloor = pkg.floor != null ? pkg.floor : -1;
    _lastSettleTime = now;
    if (pkg.narrativeOnly) {
      console.log('[M4][状态栏] 纯叙事动作，静默推进');
      return;
    }
    const actions = (pkg.actions || []).filter(a => !a.noRoll && a.d20 != null);
    if (!actions.length) {
      console.log('[M4][状态栏] 无有效掷骰动作，静默推进');
      return;
    }

    const dlg = document.getElementById('wx-settle-dialog');
    if (!dlg) return;

    if (!dlg.open) {
      typeof dlg.showModal === 'function' ? dlg.showModal() : dlg.setAttribute('open', '');
    }

    runSettleQueue(actions, pkg.account, pkg.seg);
  }

  const dieCanvasEl = document.getElementById('settleDieCanvas');
  if (dieCanvasEl) {
    dieCanvasEl.addEventListener('mousedown', e => {
      if (settleRollState !== 'SUSTAINED' && settleRollState !== 'DAMPING') {
        settleIsDragging = true; settleLastMouse = [e.clientX, e.clientY];
      }
    });
  }
  window.addEventListener('mousemove', e => {
    if (!settleIsDragging) return;
    const dx = e.clientX - settleLastMouse[0];
    const dy = e.clientY - settleLastMouse[1];
    settleLastMouse = [e.clientX, e.clientY];

    const axis = V_3D.norm([dy, -dx, 0]);
    const ang = Math.hypot(dx, dy) * 0.008;
    if (ang > 0.0001) {
      settleCurQuat = Q_3D.mul(settleCurQuat, Q_3D.fromAxis(axis, ang));
      renderSettleCanvas();
    }
  });
  window.addEventListener('mouseup', () => settleIsDragging = false);

  const settleDlgEl = document.getElementById('wx-settle-dialog');
  if (settleDlgEl) {
    settleDlgEl.addEventListener('close', () => stopSettleAnimation());
  }

  window.addEventListener('message', e => {
    if (e.data && e.data.wxSettle) { console.log('[M4][状态栏] 收到 wxSettle 消息'); showSettle(e.data.wxSettle); }
  });
  /* 调试钩子：控制台可手动弹面板验证显示链（WxStatusbar.settle({...})） */
  window.WxStatusbar = window.WxStatusbar || {};
  window.WxStatusbar.settle = showSettle;

  // 胶囊条点击选定/取消（条件不足的灰条不接点击，悬停说明缺什么）
  document.getElementById('wxChipsWrap')?.addEventListener('click', e => {
    const btn = e.target.closest('.wx-capsule-chip');
    if (!btn || btn.classList.contains('locked')) return;
    const actId = btn.dataset.actionId;
    const actName = btn.dataset.actionName;
    const actArgs = JSON.parse(btn.dataset.actionArgs || '{}');
    const danger = btn.classList.contains('danger');

    const existsIdx = currentCapsuleActions.findIndex(a => a.id === actId && JSON.stringify(a.args || {}) === JSON.stringify(actArgs));
    if (existsIdx >= 0) {
      currentCapsuleActions.splice(existsIdx, 1);
    } else {
      currentCapsuleActions = [{ id: actId, name: actName, args: actArgs, danger }];
    }
    renderActionChipsUI();
    updateInputPlaceholder();
  });

  // 二级动作抽屉内点击
  document.getElementById('wxActionDrawerBody')?.addEventListener('click', e => {
    const btn = e.target.closest('.wx-capsule-chip');
    if (!btn || btn.classList.contains('locked')) return;
    const actId = btn.dataset.actionId;
    const actName = btn.dataset.actionName;
    const actArgs = JSON.parse(btn.dataset.actionArgs || '{}');
    const danger = btn.classList.contains('danger');

    currentCapsuleActions = [{ id: actId, name: actName, args: actArgs, danger }];
    renderActionChipsUI();
    updateInputPlaceholder();

    const drawerEl = document.getElementById('wxActionDrawer');
    if (drawerEl) drawerEl.style.display = 'none';
    document.getElementById('wxMoreActionsBtn')?.classList.remove('active');
    document.getElementById('wxMoreActionsBtn')?.setAttribute('aria-expanded', 'false');
  });

  // 姿态徽标点击（默认跟缀 ⇄ 纯叙事）
  document.getElementById('wxPostureBadge')?.addEventListener('click', () => {
    postureEnabled = !postureEnabled;
    renderActionChipsUI();
    updateInputPlaceholder();
  });

  // 更多按钮开闭抽屉
  const drawerEl = document.getElementById('wxActionDrawer');
  const moreBtn = document.getElementById('wxMoreActionsBtn');
  moreBtn?.addEventListener('click', () => {
    if (!drawerEl) return;
    const isHidden = drawerEl.style.display === 'none';
    drawerEl.style.display = isHidden ? 'flex' : 'none';
    moreBtn.classList.toggle('active', isHidden);
    // 标记里声明了 aria-expanded，这里同步（C3 顺手补的可访问性）
    moreBtn.setAttribute('aria-expanded', String(isHidden));
  });
  document.getElementById('wxActionDrawerClose')?.addEventListener('click', () => {
    if (drawerEl) drawerEl.style.display = 'none';
    moreBtn?.classList.remove('active');
    moreBtn?.setAttribute('aria-expanded', 'false');
  });

  // 暴露胶囊动作给胶水与宿主：点选优先；没点选时用默认姿态「跟缀·保持当前距离」
  window.WxStatusbar = Object.assign(window.WxStatusbar || {}, {
    consumeActiveActions: function() {
      if (currentCapsuleActions && currentCapsuleActions.length) {
        const act = currentCapsuleActions.slice();
        currentCapsuleActions = [];
        renderActionChipsUI();
        updateInputPlaceholder();
        return act;
      }
      if (postureEnabled && defaultPosture) return [defaultPosture];
      return [];
    },
    getActiveActions: function() {
      if (currentCapsuleActions.length) return currentCapsuleActions.slice();
      return (postureEnabled && defaultPosture) ? [defaultPosture] : [];
    },
    setCapsuleAction: function(action) {
      if (!action) currentCapsuleActions = [];
      else currentCapsuleActions = [action];
      renderActionChipsUI();
      updateInputPlaceholder();
    }
  });

  document.getElementById('settleAck')?.addEventListener('click', () => document.getElementById('wx-settle-dialog')?.close());
  document.getElementById('settleAuto')?.addEventListener('change', async e => {
    SETTLE.auto = e.target.checked;
    const glue = (typeof globalThis !== 'undefined') && globalThis.WxGlue;
    if (glue && glue.setConf) { try { await glue.setConf({ autoSettle: SETTLE.auto }); } catch (err) { /* 非真机环境忽略 */ } }
  });
  (async () => {
    const glue = (typeof globalThis !== 'undefined') && globalThis.WxGlue;
    if (glue && glue.conf) { SETTLE.auto = !!glue.conf.autoSettle; const cb = document.getElementById('settleAuto'); if (cb) cb.checked = SETTLE.auto; }
  })();

  renderSnapshot(MOCKS.sweet);

  /* ---------- 酒馆模式：宿主通过 postMessage 递 wx_snap 快照（主通道）；iframe API 可用时轮询变量（备用通道） ---------- */
  (async function tavernMode() {
    let activated = false;
    const tools = document.querySelector(".preview-tools");
    function activate(snap) {
      if (!activated) { activated = true; if (tools) tools.style.display = "none"; }
      renderSnapshot(snap);
    }
    // 暴露全局 API（保留 M4 调试钩子 settle 与胶囊接口，防覆盖）
    window.WxStatusbar = Object.assign(window.WxStatusbar || {}, { render: activate });
    // 主通道：壳/引擎 postMessage {wxSnap}
    window.addEventListener("message", (e) => {
      if (e.data && e.data.wxSnap) activate(e.data.wxSnap);
    });
    // 备用通道：本 iframe 若有酒馆助手变量 API（原生渲染场景），轮询 wx_snap
    const holder = (typeof getVariables === "function")
      ? globalThis
      : (globalThis.TavernHelper && globalThis.TavernHelper.getVariables ? globalThis.TavernHelper : null);
    if (!holder) return;   // 本地开发环境：走 mock / 回放
    let lastStr = "";
    setInterval(async () => {
      try {
        const v = await holder.getVariables({ type: "chat" });
        const snap = v && v.wx_snap;
        if (!snap || activated) return;
        const str = JSON.stringify(snap);
        if (str !== lastStr) { lastStr = str; activate(snap); }
      } catch (e) { /* 轮询失败静默 */ }
    }, 1000);
  })();
  /* 高度自适应上报：宿主按内容调高（收起/展开不裁切），被嵌入时启用 */
  if (window.parent !== window) {
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(() => reportLayout()).observe(document.body);
    window.addEventListener("load", reportLayout);
    setTimeout(reportLayout, 300);
  }

  /* 谎账 · 雷区可视化（真机由中控谎言账本供数：可验证度定色，活跃带脉点，穿帮划线） */
  const LIES = [
    { claim: '自称新来的物业管家', verif: 'high', used: 3, status: 'active' },
    { claim: '说自己是这家店常客', verif: 'mid', used: 1, status: 'active' },
    { claim: '借口顺路一起走', verif: 'low', used: 2, status: 'busted' },
  ];
  const VER_NAME = { high: '查证类 · 会被查证', mid: '对质类 · 可能被对质', low: '无法验证 · 几乎安全' };
  const liesBodyEl = document.getElementById('liesBody');
  if (liesBodyEl) {
    liesBodyEl.innerHTML =
      LIES.map(l =>
        `<div class="lie v-${l.verif}${l.status === 'busted' ? ' busted' : ''}">` +
        `<span class="dot"></span><span>${l.claim}</span>` +
        `<span class="ver">${VER_NAME[l.verif]} · 说过${l.used}次${l.status === 'busted' ? ' · 已穿帮' : ''}</span></div>`
      ).join('') || '活跃谎言：暂无。';
  }

  /* 她的档案 · 属性直读区：打量大成功揭示真实数值；揭示后对应的模糊印象标签消失——
     准确的数值出来，模糊的指向就没有意义。悬停数值显示表现力说明。 */
  const HER_PROFILE = {
    attrs: { 体格: null, 敏捷: null, 敏锐: 7, 胆量: null },   // null = 未查明
    tags: [                                                   // 印象标签挂属性：该属性揭示即隐去
      { text: '身材匀称', attr: '体格' },
      { text: '目光警觉', attr: '敏锐' },
    ],
  };
  function herAttrTip(name, v) {
    const bands = {
      体格: [[3, '力气比一般姑娘小'], [6, '有健身的痕迹'], [99, '职业级的力气']],
      敏捷: [[3, '动作偏慢'], [6, '身手利落'], [99, '职业级的身手']],
      敏锐: [[3, '迟钝，几乎注意不到异常'], [5, '比一般人细心'], [7, '专业级的观察力——尾行最难骗过的眼睛'], [99, '顶尖的直觉，几乎瞒不过']],
      胆量: [[3, '容易慌'], [6, '沉得住气'], [99, '泰山崩于前的那种镇定']],
    }[name] || [];
    for (const [cap, text] of bands) if (v <= cap) return `${name} ${v}：${text}`;
    return `${name} ${v}`;
  }
  const revealedSet = new Set(Object.entries(HER_PROFILE.attrs).filter(([, v]) => v != null).map(([n]) => n));
  const pattrsEl = document.getElementById('pattrs');
  if (pattrsEl) {
    pattrsEl.innerHTML = Object.entries(HER_PROFILE.attrs).map(([name, v]) =>
      v == null
        ? `<div class="pattr unknown"><div class="an">${name}</div><div class="av">？</div></div>`
        : `<div class="pattr" data-tip="${herAttrTip(name, v)}"><div class="an">${name}</div><div class="av">${v}</div></div>`
    ).join('');
  }
  const ptagsEl = document.getElementById('ptags');
  if (ptagsEl) {
    ptagsEl.innerHTML =
      HER_PROFILE.tags.filter(t => !revealedSet.has(t.attr)).map(t => `<span class="tag" data-tip="模糊印象：只知道大致范围，打量大成功可揭示准确数值">${t.text}</span>`).join('')
      || '<span class="label">印象已全部被准确数值取代</span>';
  }
})();
      })(topDoc, topWin);
    } catch (e) {
      console.error("[尾行状态栏] 初始化异常:", e);
    }

    // 4. 监听胶水快照同步（单例防重复绑定）
    if (!topWin.__wxSnapListenerAttached) {
      topWin.__wxSnapListenerAttached = true;
      topWin.addEventListener("message", function(e) {
        if (e.data && e.data.wxSnap && topWin.WxStatusbar && topWin.WxStatusbar.render) {
          topWin.WxStatusbar.render(e.data.wxSnap);
        }
      });
    }
  }
})();
