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
            effectsDesc: "\u666E\u901A\u996E\u54C1\uFF0C\u65E0\u6570\u503C\u52A0\u6210",
            desc: "\u666E\u901A\u996E\u54C1\uFF0C\u5F53\u524D\u4E0D\u589E\u52A0\u884C\u52A8\u70B9\u6216\u5176\u4ED6\u6570\u503C"
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
          },
          {
            id: "daily.rest",
            name: "\u65E5\u7A0B\xB7\u4F11\u606F",
            aliases: [],
            modes: [
              "any"
            ],
            args: [],
            check: null,
            dailyOnly: true
          },
          {
            id: "daily.work",
            name: "\u65E5\u7A0B\xB7\u6253\u5DE5\uFF0F\u63A5\u5355",
            aliases: [],
            modes: [
              "any"
            ],
            args: [],
            check: null,
            dailyOnly: true
          },
          {
            id: "daily.shop",
            name: "\u65E5\u7A0B\xB7\u8D2D\u7269",
            aliases: [],
            modes: [
              "any"
            ],
            args: [],
            check: null,
            dailyOnly: true
          },
          {
            id: "daily.talk",
            name: "\u65E5\u7A0B\xB7\u72EC\u7ACB\u4EA4\u6D41",
            aliases: [],
            modes: [
              "any"
            ],
            args: [],
            check: null,
            dailyOnly: true
          },
          {
            id: "daily.tailing",
            name: "\u65E5\u7A0B\xB7\u5C3E\u884C",
            aliases: [],
            modes: [
              "any"
            ],
            args: [],
            check: null,
            dailyOnly: true
          },
          {
            id: "daily.pass",
            name: "\u65E5\u7A0B\xB7\u5EA6\u8FC7\u672C\u65F6\u6BB5",
            aliases: [],
            modes: [
              "any"
            ],
            args: [],
            check: null,
            dailyOnly: true
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

  // src/shared/random.js
  var require_random = __commonJS({
    "src/shared/random.js"(exports, module) {
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
        if (globalThis.crypto && globalThis.crypto.getRandomValues)
          globalThis.crypto.getRandomValues(buf);
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
      function actionSeed(sessionSalt, floor, seq, version = 2) {
        let h = floorSeed(sessionSalt, floor);
        if (version >= 2 && typeof seq === "string")
          h = floorSeed(String(sessionSalt) + ":domain:" + seq, floor);
        else h ^= seq * 2654435761 & MASK;
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
        return {
          dice: [d(next, 10), d(next, 10)],
          sum: null,
          get total() {
            return this.dice[0] + this.dice[1];
          }
        };
      }
      function pickIndex(seed, count) {
        if (!Number.isInteger(count) || count <= 0)
          throw new RangeError("\u5019\u9009\u6570\u91CF\u5FC5\u987B\u4E3A\u6B63\u6574\u6570");
        return Math.floor(rng(seed)() * count);
      }
      module.exports = {
        pickIndex,
        newSessionSalt,
        rng,
        floorSeed,
        actionSeed,
        rollD20,
        roll2D10
      };
    }
  });

  // src/runtime/dice.js
  var require_dice = __commonJS({
    "src/runtime/dice.js"(exports, module) {
      "use strict";
      module.exports = require_random();
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
        if (init.nrv != null && init.heart == null)
          start.heart = C.heartBaseline(init.nrv);
        for (const [k, v] of Object.entries(start)) {
          if (typeof v !== "number" || !Number.isFinite(v))
            throw new TypeError(`\u521D\u59CB\u8D26\u76EE\u5FC5\u987B\u4E3A\u6709\u9650\u6570\u5B57: ${k}`);
          start[k] = Math.max(LIMITS[k][0], Math.min(LIMITS[k][1], v));
        }
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
            const after = { ...state };
            for (const [k, dv] of Object.entries(changes)) {
              if (!Object.prototype.hasOwnProperty.call(LIMITS, k))
                throw new Error(`\u672A\u77E5\u8D26\u76EE: ${k}`);
              if (typeof dv !== "number" || !Number.isFinite(dv))
                throw new TypeError(`\u8D26\u76EE\u589E\u91CF\u5FC5\u987B\u4E3A\u6709\u9650\u6570\u5B57: ${k}`);
              const nv = clamp(k, state[k] + dv);
              applied[k] = nv - state[k];
              after[k] = nv;
            }
            Object.assign(state, after);
            const seqNo = ++seq;
            snapshots.set(seqNo, {
              before,
              after: { ...state },
              changes,
              meta,
              applied
            });
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
          settleAction({
            alertD = 0,
            heartD = 0,
            piD = 0,
            staminaD = 0,
            cashD = 0,
            proximityD = 0,
            faceMemD = 0
          }, meta) {
            return this.commit(
              {
                alert: alertD,
                heart: heartD,
                pi: piD,
                stamina: staminaD,
                cash: cashD,
                proximity: proximityD,
                faceMem: faceMemD
              },
              meta
            );
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
            const r = this.commit(
              {
                wariness: warinessD,
                alert: -state.alert,
                // 当晚警觉清零
                heart: C.heartBaseline(nrv) - state.heart,
                // 回基线
                stamina: staminaTarget - state.stamina,
                // 恢复至（非恢复量）
                date: 1
              },
              { reason: "settleNight" }
            );
            return {
              ...r,
              warinessGain: warinessD,
              restRatio: rest,
              nextStartAlert: Math.round(state.wariness / 5)
            };
          },
          /** 追缉：只升不降（7 日冷却回落由调度层走 commit 直改，此处封快路径）。 */
          raisePursuit(level) {
            if (level <= state.pursuit) return null;
            return this.commit(
              { pursuit: level - state.pursuit },
              { reason: "pursuit" }
            );
          }
        };
      }
      module.exports = { createLedger, LIMITS };
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

  // src/contracts/persona.js
  var require_persona = __commonJS({
    "src/contracts/persona.js"(exports, module) {
      "use strict";
      var LP = require_lifepack();
      var W = require_wardrobe();
      var R = require_rules();
      function personalityIdOf(persona) {
        if (!persona) return null;
        const value = persona.personalityId || persona.personalityTag || persona.personality?.id || persona.personality;
        if (typeof value !== "string") return null;
        return R.targets.generator.personalityPool.find(
          (p) => p.id === value || p.name === value
        )?.id || value;
      }
      function normalizePersona(value) {
        if (value == null) return null;
        const copy = JSON.parse(JSON.stringify(value));
        const id = personalityIdOf(copy);
        if (id) copy.personalityId = id;
        return copy;
      }
      function validatePersona(value, targetId, { complete = false, references = true } = {}) {
        if (value == null && !complete) return;
        const fail = (field) => {
          throw Object.assign(new Error(`\u4EBA\u7269\u6570\u636E\u65E0\u6548\uFF1A${field}`), {
            code: "PERSONA_INVALID"
          });
        };
        if (!value || typeof value !== "object" || Array.isArray(value)) fail("\u753B\u50CF");
        if (value.targetId && value.targetId !== targetId) fail("\u76EE\u6807\u7C7B\u578B\u4E0D\u4E00\u81F4");
        if (references && !R.targets.list[targetId]) fail("\u76EE\u6807\u7C7B\u578B");
        const pid = personalityIdOf(value);
        if (references && pid && !R.tags[pid] && !["oblivious", "curious", "anxious"].includes(pid))
          fail("\u6027\u683C");
        for (const field of ["personalityTag", "hobbyTag", "shoeId"])
          if (references && value[field] && !R.tags[value[field]]) fail(field);
        if (value.finalStats) {
          for (const [key, n] of Object.entries(value.finalStats))
            if (!["str", "agi", "per", "nrv", "social"].includes(key) || !Number.isFinite(n) || n < 1 || n > 10)
              fail(`\u5C5E\u6027 ${key}`);
        }
        if (value.assignedFacts != null && (!Array.isArray(value.assignedFacts) || value.assignedFacts.some((f) => !f || typeof f.id !== "string")))
          fail("\u56FA\u5B9A\u4E8B\u5B9E");
        for (const field of ["hair", "body"])
          if (references && value[field] != null && !W.variants[field].includes(value[field]))
            fail(field);
        if (value.generatorVersion != null && (typeof value.generationSeed !== "string" || !value.generationSeed))
          fail("\u751F\u6210\u79CD\u5B50");
        if (complete) {
          if (typeof value.generationSeed !== "string" || !value.generationSeed)
            fail("\u751F\u6210\u79CD\u5B50");
          if (!R.targets.generator.personalityPool.some((p) => p.id === pid))
            fail("\u6027\u683C\u5F15\u7528");
          if (!R.targets.generator.hobbyPool.some((h) => h.id === value.hobbyId))
            fail("\u7231\u597D\u5F15\u7528");
          const pack = LP.packs[targetId];
          if (pack) {
            const validFacts = new Set((pack.factPool || []).map((f) => f.id));
            for (const [key, pool] of Object.entries(pack)) {
              if (key.endsWith("Pool") && Array.isArray(pool))
                for (const branch of pool)
                  for (const f of branch.facts || []) validFacts.add(f.id);
            }
            if (value.assignedFacts?.some((f) => !validFacts.has(f.id)))
              fail("\u4E8B\u5B9E\u5F15\u7528");
            const slotPools = {
              home: "homePool",
              schedule: "schedulePool",
              carry: "carryPool",
              social: "socialPool",
              psyche: "psychePool",
              romance: "romancePool"
            };
            for (const [slot, pool] of Object.entries(slotPools)) {
              const selected = value.factSummary?.[slot];
              if (selected != null && !pack[pool]?.some((b) => b.id === selected))
                fail(`\u4E8B\u5B9E\u5206\u652F ${slot}`);
            }
          }
        }
        if (value.generatorVersion != null && value.generatorVersion !== 1)
          fail("\u751F\u6210\u5668\u7248\u672C");
        if (complete && (!value.name || !pid || !value.hobbyId || !value.shoeId || !value.finalStats || !Array.isArray(value.assignedFacts)))
          fail("\u5B8C\u6574\u753B\u50CF");
        if (complete && ["str", "agi", "per", "nrv", "social"].some(
          (k) => !Number.isFinite(value.finalStats[k])
        ))
          fail("\u5C5E\u6027\u7F3A\u5931");
      }
      module.exports = { personalityIdOf, normalizePersona, validatePersona };
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

  // src/persona/facts.js
  var require_facts = __commonJS({
    "src/persona/facts.js"(exports, module) {
      "use strict";
      var LP = require_lifepack();
      var D = require_random();
      var { personalityIdOf } = require_persona();
      function toSeed(seed) {
        return typeof seed === "number" ? seed >>> 0 : D.floorSeed(String(seed || 0), 0);
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
          if (persona) {
            persona.assignedFacts = facts;
            persona.factSummary = {};
          }
          return { assignedFacts: facts, factSummary: {} };
        }
        const next = D.rng(toSeed(seed));
        const personalityId = personalityIdOf(persona) || "casual";
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
        const chosenBranches = [
          chosenHome,
          chosenSchedule,
          chosenCarry,
          chosenSocial,
          chosenPsyche,
          chosenRomance
        ].filter(Boolean);
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
      module.exports = { resolveTargetFacts };
    }
  });

  // src/runtime/target_state.js
  var require_target_state = __commonJS({
    "src/runtime/target_state.js"(exports, module) {
      var D = require_dice();
      var { personalityIdOf } = require_persona();
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
        const total = list.reduce((s, it) => s + (it[weightKey] ?? 1), 0);
        if (!Number.isFinite(total) || total <= 0 || list.some(
          (it) => !Number.isFinite(it[weightKey] ?? 1) || (it[weightKey] ?? 1) < 0
        ))
          throw new RangeError("\u65E0\u6548\u7684\u62BD\u6837\u6743\u91CD");
        const next = D.rng(toSeed(seed));
        const r = next() * total;
        let acc = 0;
        for (const it of list) {
          acc += it[weightKey] ?? 1;
          if (r < acc) return { item: it, next };
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
      var SWEET_EXCLUDE_FOR_COOL = /* @__PURE__ */ new Set([
        "outfit_sailor_jk",
        "outfit_plaid_jk",
        "outfit_lolita_jsk"
      ]);
      function sampleOutfit(pack, date, seed, persona) {
        const p = pack || LP.packs.college || LP.packs.student;
        const weekend = isWeekend(date);
        if (p.outfits && p.outfits.length) {
          const personalityId = personalityIdOf(persona) || pack && pack.traits && pack.traits.find((t) => PERSONALITY_STYLE_MAP[t]) || "casual";
          const allowedStyles = PERSONALITY_STYLE_MAP[personalityId] || [
            "casual",
            "elegant"
          ];
          let candidates = p.outfits.filter(
            (o) => allowedStyles.includes(o.styleGroup)
          );
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
          const idx = D.pickIndex(toSeed(seed), candidates.length);
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
          {
            id: "normal",
            name: "\u81EA\u7136\u5782\u624B",
            weight: 100,
            duration: 2,
            tag: null,
            desc: "\u81EA\u7136\u6446\u81C2\u524D\u884C"
          }
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
              duration: {
                type: "scene",
                count: targetState.hand.remainingDuration || 1
              }
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
        const personalityId = personalityIdOf(persona) || pack && pack.traits && pack.traits.find(
          (t) => [
            "timid",
            "guarded",
            "stubborn",
            "gentle",
            "curious",
            "oblivious"
          ].includes(t)
        ) || "timid";
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
      var { resolveTargetFacts } = require_facts();
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

  // src/runtime/game/constants.js
  var require_constants = __commonJS({
    "src/runtime/game/constants.js"(exports, module) {
      "use strict";
      var DIST_KEY = { far: "far", same: "same", close: "close", touch: "touch" };
      var DIST_CN = { far: "\u8FDC\u7AEF", same: "\u540C\u8857", close: "\u8EAB\u540E", touch: "\u8D34\u8EAB" };
      var DIST_RANK = { far: 0, same: 1, close: 2, touch: 3 };
      var DIST_DOWN = { touch: "close", close: "same", same: "far", far: "far" };
      var CA_CN = {
        front: "\u6B63\u9762",
        side: "\u4FA7\u9762",
        back: "\u80CC\u9762",
        "three-quarter": "\u659C\u4FA7"
      };
      var WEATHER_BANDS = { clear: [1, 14], rain: [15, 18], storm: [19, 20] };
      var WEATHER_ICON = { clear: "\u{1F319} \u6674\u591C", rain: "\u{1F327} \u5C0F\u96E8", storm: "\u26C8 \u66B4\u96E8" };
      var HUNTER_MODES = ["stealth", "contact", "vehicle"];
      var TAIL_PUMP_IDS = [
        "follow",
        "ride_along",
        "transfer",
        "follow_work",
        "ride_follow",
        "car_follow"
      ];
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
      module.exports = {
        DIST_KEY,
        DIST_CN,
        DIST_RANK,
        DIST_DOWN,
        CA_CN,
        WEATHER_BANDS,
        WEATHER_ICON,
        HUNTER_MODES,
        TAIL_PUMP_IDS,
        SHOE_ID_MAP,
        SHOE_DIST_FACTOR
      };
    }
  });

  // src/runtime/game/target.js
  var require_target = __commonJS({
    "src/runtime/game/target.js"(exports, module) {
      "use strict";
      var { personalityIdOf } = require_persona();
      var R = require_rules();
      var D = require_dice();
      var T = require_tags();
      var LP = require_lifepack();
      var TS = require_target_state();
      var map = require_map();
      var { SHOE_ID_MAP, WEATHER_BANDS } = require_constants();
      function createTargetSystem({ g, L, seedAt, log, syncHeartTags }) {
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
            const oldShoe = stack.find(
              (t) => t.owner === "target" && t.id && t.id.startsWith("shoe_")
            );
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
          const tag = (g.tags || []).find(
            (t) => t.owner === "target" && t.id && t.id.startsWith("shoe_")
          );
          return tag && R.tags ? R.tags[tag.id] || null : null;
        }
        function applyShoeMod(stats) {
          const def = activeShoeDef();
          if (!def || !def.mod || !stats) return stats;
          for (const [k, v] of Object.entries(def.mod)) {
            if (stats[k] !== void 0)
              stats[k] = Math.max(1, Math.min(10, stats[k] + v));
          }
          return stats;
        }
        function initTargetState(dateOverride) {
          const pack = LP.packs && LP.packs[g.targetId] || LP.packs.college || LP.packs.student;
          const d = dateOverride ?? (L.get("date") || 1);
          const dayOfWeek = ((d || 1) - 1) % 7 + 1;
          const isLimping = TS.isLimpingDate(d, g.lastHotelDate);
          if (dayOfWeek === 6 && (pack.id === "student" || pack.id === "college") && !g.route) {
            const routine = g.targetPersona?.saturdayRoutine || (g.targetPersona ? g.targetPersona.saturdayRoutine = TS.resolveSaturdayRoutine(
              pack,
              g.targetPersona,
              seedAt(0, "saturday_routine")
            ) : "cram");
            const personalityId = personalityIdOf(g.targetPersona) || "timid";
            const routeDef = TS.resolveSaturdayRoute(
              pack,
              routine,
              g.dateCount || 0,
              personalityId,
              seedAt(d, "saturday_route_branch"),
              { hotelVisitedCount: g.hotelVisitedCount || 0 }
            );
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
            const sundayRoute = (pack.routes || []).find(
              (r) => r.id === "sunday_rest"
            ) || {
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
          const outfit = TS.sampleOutfit(
            pack,
            d,
            seedAt(d, "outfit"),
            g.targetPersona || g.target
          );
          const somatic = TS.sampleSomatic(pack, seedAt(d, "somatic"), { isLimping });
          const curPlaceId = g.route && g.route.here >= 0 ? g.route.nodes[g.route.here] : g.route && g.route.nodes ? g.route.nodes[0] : null;
          const curPlaceName = curPlaceId ? map.getPlace(curPlaceId)?.name || curPlaceId : null;
          const hand = TS.resolveHand(
            pack,
            curPlaceId,
            null,
            seedAt(g.floor || 0, "hand")
          );
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
        function syncTargetShoeTags() {
          const stack = g.tags || (g.tags = []);
          const found = stack.find(
            (t) => t.owner === "target" && t.id && t.id.startsWith("shoe_")
          );
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
        function nightFall() {
          if (g.tailing) {
            const atEnd = g.route && g.route.here >= g.route.nodes.length - 1;
            if (!atEnd)
              return {
                blocked: true,
                reason: "\u804C\u4E1A\u75C5\uFF1A\u8DDF\u7F00\u672A\u7ED3\u675F\uFF0C\u4ECA\u665A\u53EA\u80FD\u8DDF\u4E22\u6216\u8DDF\u5979\u5230\u5BB6"
              };
          }
          const curDate = L.get("date");
          if (g.route && g.route.id === "saturday_date_hotel") {
            g.hotelVisitedCount = (g.hotelVisitedCount || 0) + 1;
            g.lastHotelDate = curDate;
          }
          const r = L.settleNight({
            peakAlert: L.get("alert"),
            nrv: g.player.nrv,
            staminaMax: g.player.staminaMax
          });
          (g.tags || (g.tags = [])).length ? T.clearNight(g.tags) && (g.tags = T.clearNight(g.tags)) : null;
          syncHeartTags();
          g.consecFails = 0;
          const mult = g.identity && R.identity.list[g.identity] && R.identity.list[g.identity].piMult || 1;
          let piBonus = 0;
          if (mult > 1 && g.nightPiGross > 0) {
            piBonus = Math.round(g.nightPiGross * (mult - 1));
            if (piBonus > 0) {
              L.commit({ pi: piBonus }, { reason: "identity_pi" });
              log(
                `[\u8EAB\u4EFD] PI\xD7${mult}\uFF1A\u5F53\u665A\u6BDB\u5165\u8D26 ${g.nightPiGross}\uFF0C\u8865\u5DEE +${piBonus}`
              );
            }
          }
          g.nightPiGross = 0;
          g.tailing = false;
          g.nightDrinkUsed = false;
          g.alertLatch = [];
          g.alertEvent = null;
          g.alertHold = 0;
          g.fleeing = false;
          const wd = D.rollD20(seedAt(9e3 + (g.floor || 0), "weather")).d20;
          g.world.weather = wd <= WEATHER_BANDS.clear[1] ? "clear" : wd <= WEATHER_BANDS.rain[1] ? "rain" : "storm";
          g.nightStartFloor = g.floor || 0;
          const nextDate = L.get("date");
          const dayOfWeek = ((nextDate || 1) - 1) % 7 + 1;
          const pack = LP.packs && LP.packs[g.targetId] || LP.packs.college || LP.packs.student;
          const isLimping = TS.isLimpingDate(nextDate, g.lastHotelDate);
          if (dayOfWeek === 6 && (pack.id === "student" || pack.id === "college")) {
            const routine = g.targetPersona?.saturdayRoutine || (g.targetPersona ? g.targetPersona.saturdayRoutine = TS.resolveSaturdayRoutine(
              pack,
              g.targetPersona,
              seedAt(0, "saturday_routine")
            ) : "cram");
            if (routine === "date") {
              g.dateCount = (g.dateCount || 0) + 1;
            }
            const personalityId = personalityIdOf(g.targetPersona) || "timid";
            const routeDef = TS.resolveSaturdayRoute(
              pack,
              routine,
              g.dateCount || 0,
              personalityId,
              seedAt(nextDate, "saturday_route_branch"),
              { hotelVisitedCount: g.hotelVisitedCount || 0 }
            );
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
            const sundayRoute = (pack.routes || []).find(
              (r2) => r2.id === "sunday_rest"
            ) || {
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
              routeDef = pack.routes.find(
                (r2) => r2.id === "friday_late" || r2.id === "college_friday_night"
              );
            }
            if (!routeDef) {
              routeDef = pack.routes.find(
                (r2) => r2.id === "college_evening" || r2.id === "workday_evening"
              ) || pack.routes[0];
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
          const outfit = TS.sampleOutfit(
            pack,
            nextDate,
            seedAt(nextDate, "outfit"),
            g.targetPersona || g.target
          );
          const somatic = TS.sampleSomatic(pack, seedAt(nextDate, "somatic"), {
            isLimping
          });
          const startPlaceId = g.route && g.route.nodes ? g.route.nodes[0] : null;
          const startPlaceName = startPlaceId ? map.getPlace(startPlaceId)?.name || startPlaceId : null;
          const hand = TS.resolveHand(
            pack,
            startPlaceId,
            null,
            seedAt(9e3 + (g.floor || 0), "hand_night")
          );
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
          return {
            seq: r.seq,
            warinessGain: r.warinessGain,
            nextStartAlert: r.nextStartAlert,
            date: L.get("date"),
            nextWeather: g.world.weather,
            piBonus,
            targetState: g.targetState
          };
        }
        return {
          applyTargetState,
          applyShoeMod,
          initTargetState,
          syncTargetShoeTags,
          syncPersonaTags,
          nightFall
        };
      }
      module.exports = { createTargetSystem };
    }
  });

  // src/contracts/action-requirements.js
  var require_action_requirements = __commonJS({
    "src/contracts/action-requirements.js"(exports, module) {
      "use strict";
      function classifyPlace(id, name = "") {
        const place = String(id || ""), label = String(name || "");
        if (/unit|stairs|gate|door|porch|lobby|entrance/i.test(place) || /楼道|单元|门|玄关|电梯|台阶|入口/.test(label))
          return "door";
        if (/residence|room|home|flat|apartment|villa/i.test(place) || /客厅|卧室|房间|室内|屋内/.test(label))
          return "room";
        return "";
      }
      function requirementFailure(requires, context) {
        if (!requires) return null;
        if (requires.place && context.placeKind !== requires.place)
          return {
            code: "place",
            reason: `\u9700\u8981${requires.place === "door" ? "\u95E8\u524D / \u697C\u9053 / \u7384\u5173" : "\u5BA4\u5185"}\u573A\u6240`
          };
        if (requires.dist?.length && !requires.dist.includes(context.dist))
          return {
            code: "dist",
            reason: `\u9700\u8981${requires.dist.map((d) => ({ far: "\u8FDC\u7AEF", same: "\u540C\u8857", close: "\u8EAB\u540E", touch: "\u8D34\u8EAB" })[d] || d).join(" / ")}\u8DDD\u79BB`
          };
        const items = requires.items || [];
        if (items.length && !context.inventory.some(
          (it) => items.includes(it.id) && (it.count ?? 1) > 0
        ))
          return { code: "items", reason: "\u7F3A\u5C11\u6240\u9700\u968F\u8EAB\u5DE5\u5177" };
        return null;
      }
      module.exports = { classifyPlace, requirementFailure };
    }
  });

  // src/runtime/game/actions.js
  var require_actions = __commonJS({
    "src/runtime/game/actions.js"(exports, module) {
      "use strict";
      var {
        requirementFailure
      } = require_action_requirements();
      var R = require_rules();
      var C = require_checks();
      var { DIST_CN, DIST_KEY, DIST_RANK } = require_constants();
      function createActionSystem({
        g,
        L,
        lex,
        log,
        capturePhoto,
        currentPlaceKind,
        gain,
        runCheck,
        syncHeartTags
      }) {
        function settleAction(tag, seq) {
          const entry = lex.byId.get(tag.id);
          if (!entry) return null;
          const out = {
            type: "action",
            id: tag.id,
            name: tag.name,
            label: tag.label || tag.name
          };
          if (entry.dailyOnly) {
            out.rejected = true;
            out.reason = "\u8BF7\u901A\u8FC7\u65E5\u7A0B\u884C\u52A8\u533A\u5B89\u6392\u8FD9\u9879\u6D3B\u52A8";
            return out;
          }
          if (!(entry.modes || []).includes(g.mode) && !(entry.modes || []).includes("any")) {
            out.rejected = true;
            out.reason = `\u52A8\u4F5C [${tag.name}] \u9700\u8981\u6A21\u5F0F\uFF1A${(entry.modes || []).join("/")}`;
            return out;
          }
          const failure = requirementFailure(entry.requires, {
            placeKind: currentPlaceKind(),
            dist: g.dist,
            inventory: g.player.inventory || []
          });
          if (failure) {
            out.rejected = true;
            out.reason = `\u52A8\u4F5C [${tag.name}] ${failure.reason}${failure.code === "items" ? "\uFF1A" + entry.requires.items.map((id) => R.items[id]?.name || id).join(" / ") : ""}`;
            return out;
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
              const r2 = L.commit(
                { heart: -Math.min(gainAmt, L.get("heart") - 20) },
                { reason: "breath" }
              );
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
          const { roll, res, mods, dc, attr, targetMod, darkReveal } = runCheck(
            entry,
            tag.args,
            seq
          );
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
          const r = L.settleAction(
            { alertD, heartD, piD, staminaD, faceMemD },
            { reason: tag.id }
          );
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
          log(
            `[${tag.name}] 1d20(${roll.d20}) ${mods.map((m) => `${m.v >= 0 ? "+" : ""}${m.v} ${m.src}`).join(" ")} = ${res.total} vs DC ${dc} \u2192 ${res.band}`
          );
          return out;
        }
        return { settleAction };
      }
      module.exports = { createActionSystem };
    }
  });

  // src/runtime/game/clock.js
  var require_clock = __commonJS({
    "src/runtime/game/clock.js"(exports, module) {
      "use strict";
      function clockMinutes(g, floor = g.floor) {
        const match = String(g.route?.startTime || "21:00").match(
          /^(\d{1,2}):(\d{2})$/
        );
        const base = match ? Number(match[1]) * 60 + Number(match[2]) : 1260;
        return base + Math.max(0, (floor || 1) - (g.nightStartFloor || 0) - 1) * 15;
      }
      function clockLabel(g) {
        const min = clockMinutes(g);
        return `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
      }
      module.exports = { clockMinutes, clockLabel };
    }
  });

  // src/contracts/validation.js
  var require_validation = __commonJS({
    "src/contracts/validation.js"(exports, module) {
      "use strict";
      function validateActions(value) {
        if (!Array.isArray(value) || value.length > 3)
          throw new TypeError("\u52A8\u4F5C\u961F\u5217\u5FC5\u987B\u4E3A\u6570\u7EC4\uFF0C\u6700\u591A\u4E09\u4E2A\u52A8\u4F5C");
        for (const action of value) {
          if (!action || typeof action !== "object" || typeof action.id !== "string" && typeof action.name !== "string")
            throw new TypeError("\u52A8\u4F5C\u9700\u8981\u6709\u6548 id \u6216\u540D\u79F0");
          if (action.args != null && (typeof action.args !== "object" || Array.isArray(action.args)))
            throw new TypeError("\u52A8\u4F5C\u53C2\u6570\u5FC5\u987B\u4E3A\u5BF9\u8C61");
          if (action.args?.dist != null && !["far", "same", "close", "touch"].includes(action.args.dist))
            throw new TypeError("\u65E0\u6548\u7684\u8DDD\u79BB\u53C2\u6570");
          if (action.args?.style != null && !["assault", "ambush"].includes(action.args.style))
            throw new TypeError("\u65E0\u6548\u7684\u52A8\u4F5C\u65B9\u5F0F");
        }
      }
      module.exports = { validateActions };
    }
  });

  // src/runtime/parse.js
  var require_parse = __commonJS({
    "src/runtime/parse.js"(exports, module) {
      "use strict";
      var { normalize, loadLexicon } = require_lexicon2();
      var MODE_WORDS = {
        prepare: "prepare",
        \u51C6\u5907: "prepare",
        stealth: "stealth",
        \u6F5C\u884C: "stealth",
        contact: "contact",
        \u63A5\u89E6: "contact",
        vehicle: "vehicle",
        \u8F66\u53A2: "vehicle"
      };
      var VERIF_WORDS = {
        high: "high",
        \u9AD8: "high",
        mid: "mid",
        \u4E2D: "mid",
        low: "low",
        \u4F4E: "low"
      };
      var ACTION_QUEUE_MAX = 3;
      var KINDS = { ACTION: "\u52A8\u4F5C", FACT: "\u4E8B\u5B9E", LIE: "\u8C0E\u8A00", MODE: "\u6A21\u5F0F" };
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
        function read(kind, body, compact = false) {
          const split = () => {
            if (body.includes("|")) diag.halfWidthPipe++;
            return body.split(/[｜|]/).map((s) => s.trim()).filter(Boolean);
          };
          try {
            if (kind === "\u52A8\u4F5C") {
              if (actionCount >= ACTION_QUEUE_MAX) {
                diag.actionOverflow++;
                return;
              }
              const entry = L.byId.get(body.trim());
              const r = entry ? { hit: true, id: entry.id, name: entry.name, args: {} } : normalize(split().join(" "), L);
              if (!r.hit) {
                diag.parseErrors++;
                diag.unknownAction.push(body.slice(0, 24));
                return;
              }
              actionCount++;
              tags.push({ type: "action", id: r.id, name: r.name, args: r.args });
            } else if (kind === "\u4E8B\u5B9E") {
              const match = /^#([\w-]+)$/.exec(split()[0] || "");
              if (!match) {
                diag.factBad++;
                return;
              }
              tags.push({
                type: "fact",
                ticket: /^\d+$/.test(match[1]) ? Number(match[1]) : match[1]
              });
            } else if (kind === "\u8C0E\u8A00") {
              const segs = split();
              const level = compact && segs.length === 2 ? VERIF_WORDS[segs[0].toLowerCase()] : VERIF_WORDS[(segs[3] || "").toLowerCase()];
              if (!level || segs.length < 4 && !(compact && segs.length === 2)) {
                diag.lieBad++;
                return;
              }
              tags.push({
                type: "lie",
                claim: compact && segs.length === 2 ? segs[1] : segs[0],
                to: compact && segs.length === 2 ? "target" : segs[1],
                scene: segs[2] || "current",
                verifiability: level
              });
            } else if (kind === "\u6A21\u5F0F") {
              const mode = MODE_WORDS[body.trim().toLowerCase()];
              if (!mode) {
                diag.modeBad++;
                return;
              }
              if (modeCount++) {
                diag.modeDup++;
                return;
              }
              tags.push({ type: "mode", mode });
            }
          } catch {
            diag.parseErrors++;
          }
        }
        const cleanText = String(text || "").replace(
          /<(动作|事实|谎言|模式)>([\s\S]*?)<\/\1>|<!--([\s\S]*?)-->/g,
          (full, kind, body, comment) => {
            if (kind) {
              read(kind, body);
              return "";
            }
            let recognized = false;
            for (const match of comment.matchAll(
              /\[(ACTION|FACT|LIE|MODE):([^\]]*)\]/gi
            )) {
              recognized = true;
              read(KINDS[match[1].toUpperCase()], match[2], true);
            }
            return recognized ? "" : full;
          }
        ).trim();
        return { tags, cleanText, diag };
      }
      function verifyEvidence(cleanText, claim) {
        return !!claim && !!cleanText && cleanText.includes(claim);
      }
      module.exports = { parseFloor, verifyEvidence, ACTION_QUEUE_MAX };
    }
  });

  // src/runtime/game/turn.js
  var require_turn = __commonJS({
    "src/runtime/game/turn.js"(exports, module) {
      "use strict";
      var { clockLabel } = require_clock();
      var { validateActions } = require_validation();
      var R = require_rules();
      var C = require_checks();
      var D = require_dice();
      var LP = require_lifepack();
      var TS = require_target_state();
      var map = require_map();
      var { normalize: D_norm } = require_lexicon2();
      var { parseFloor, verifyEvidence } = require_parse();
      var { DIST_KEY, HUNTER_MODES, TAIL_PUMP_IDS } = require_constants();
      function createTurnSystem({
        g,
        L,
        lex,
        seedAt,
        log,
        addProxLog,
        advanceRouteByClock,
        applyTargetState,
        categoryOf,
        herAdvance,
        resolveAlertCross,
        settleAction,
        snapshot,
        sweetHighNow,
        syncThresholdTags
      }) {
        function rollEnvSfx() {
          if (g.mode !== "stealth") return null;
          const here = g.route ? g.route.here : -1;
          const curId = g.route && here >= 0 ? g.route.nodes[here] : null;
          const cur = curId ? map.getPlace(curId) : null;
          if (!cur) return null;
          if (curId.includes("metro") || curId.includes("lobby") || curId.includes("store"))
            return null;
          const sfxSeed = seedAt(g.floor || 0, 99);
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
          if (opts.actions != null) validateActions(opts.actions);
          let queue = [];
          if (opts.actions && opts.actions.length) {
            queue = opts.actions.map((act) => {
              const entry = act.id && lex.byId.get(act.id) || act.name && lex.byName.get(act.name);
              if (!entry)
                throw Object.assign(
                  new Error(`\u672A\u6CE8\u518C\u7684\u52A8\u4F5C\uFF1A${act.id || act.name}`),
                  { code: "ACTION_INVALID" }
                );
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
          const results = processFloor(playerText || "", {
            ...opts,
            _actionQueue: queue,
            _fromInput: true
          });
          results.queue = queue.map((r) => ({
            id: r.id,
            name: r.name,
            args: r.args
          }));
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
          if (opts.replyOnly) return processReply(llmText);
          const beforeLedger = { ...L.state };
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
            g.targetState.hand = TS.resolveHand(
              pack,
              curId,
              g.targetState.hand,
              seedAt(g.floor || 0, "hand")
            );
            if (g.targetState.route && g.route) {
              g.targetState.route.here = here;
              g.targetState.route.currentPlace = curId ? map.getPlace(curId)?.name || curId : null;
            }
            applyTargetState();
          }
          const { tags, cleanText, diag } = opts._fromInput ? { tags: [], cleanText: String(llmText || ""), diag: {} } : parseFloor(llmText, lex);
          syncThresholdTags();
          const results = {
            floor: g.floor,
            actions: [],
            facts: [],
            lies: [],
            mode: null,
            diag,
            logs: g.logs,
            ledgerSeqs: []
          };
          const floorApplied = {
            stamina: 0,
            heart: 0,
            alert: 0,
            pi: 0,
            proximity: 0,
            cash: 0
          };
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
          const actionQueue = replyOnly ? [] : Array.isArray(opts._actionQueue) ? opts._actionQueue.map((a) => ({
            type: "action",
            id: a.id,
            name: a.name,
            label: a.label || a.name,
            args: a.args
          })) : opts._fromInput ? [] : tags.filter((t) => t.type === "action");
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
                tailFloor = {
                  band: out.band,
                  dist: DIST_KEY[tag.args?.dist] || g.dist
                };
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
            if (!tailFloor && g.mode === "contact" && !calm && actionQueue.some(
              (t) => t.type === "action" && lex.byId.get(t.id) && categoryOf(t.id) === "social"
            )) {
              pumped.push({ stim: P.social, src: "\u4F2A\u88C5\u5BD2\u6684" });
            }
            const sfx = rollEnvSfx();
            g._envSfx = sfx;
            if (sfx) {
              let stim = P.env[sfx] || 0;
              const fam = g.famSegs[g.world.district] || 0;
              const halved = fam >= R.heart.areaFamiliarSegments;
              if (halved) stim = Math.round(stim * P.familiarEnvFactor);
              pumped.push({
                stim,
                src: (sfx === "cat" ? "\u732B\u60CA\u53EB" : "\u72D7\u5420") + (halved ? "\xB7\u719F\u533A\u51CF\u534A" : "")
              });
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
            let appliedTax = 0;
            if (tax) {
              appliedTax = L.commit({ stamina: tax }, { reason: "seg_tax" }).applied.stamina;
              floorApplied.stamina += appliedTax;
              log(`[\u6BB5\u7A0E] \u5FC3\u8DF3\u5CF0\u503C ${heartPeak} \u2192 \u4F53\u529B ${appliedTax}`);
            }
            const dropped = C.segHeartDrop(L.get("heart"), g.player.nrv);
            if (dropped !== L.get("heart")) {
              const dH = dropped - L.get("heart");
              L.commit({ heart: dH }, { reason: "seg_drop" });
              floorApplied.heart += dH;
            }
            results.seg = { heartPeak, staminaTax: appliedTax };
            const d = g.world.district;
            if (d && g.famSegs[d] !== void 0) {
              g.famSegs[d] = Math.min(g.famSegs[d] + 1, R.heart.areaFamiliarSegments);
            }
          }
          if (floorApplied.proximity !== 0) {
            const actName = actionQueue[0]?.name || "\u63A5\u89E6\u4EA4\u4E92";
            addProxLog(floorApplied.proximity, actName);
          }
          if (floorApplied.alert >= 8 || C.alertStage(L.get("alert")) >= 2) {
            const stage = C.alertStage(L.get("alert"));
            const pack = LP.packs && LP.packs[g.targetId] || LP.packs.college || LP.packs.student;
            const flavor = pack.flavor || {};
            if (stage === 3)
              g.lastHerAlert = `\u26A0\uFE0F \u76EE\u6807\u795E\u8272\u614C\u4E71\uFF0C\u811A\u6B65\u660E\u663E\u52A0\u5FEB\uFF01\uFF08${flavor.evade || "\u5C0F\u8DD1\u79BB\u5F00"}\uFF09`;
            else if (stage === 2)
              g.lastHerAlert = `\u26A0\uFE0F \u76EE\u6807\u653E\u6162\u811A\u6B65\uFF0C\u9891\u9891\u4FA7\u76EE\u56DE\u987E\uFF01\uFF08${flavor.face || "\u5077\u77A5\u8EAB\u540E"}\uFF09`;
            else if (floorApplied.alert >= 8)
              g.lastHerAlert = `\u26A0\uFE0F \u76EE\u6807\u4F3C\u4E4E\u6709\u6240\u5BDF\u89C9\uFF0C\u6B65\u4F10\u6709\u4E9B\u8FDF\u7591\uFF08${flavor.face || "\u7565\u5E26\u8B66\u60D5"}\uFF09`;
          }
          const tm = clockLabel(g);
          const firstAction = results.actions[0];
          let signalTxt = null;
          if (firstAction) {
            if (firstAction.id === "follow") signalTxt = "\u76EE\u6807\u6CBF\u8857\u524D\u884C\uFF0C\u7EF4\u6301\u7A33\u5B9A\u6B65\u9891";
            else if (firstAction.id === "photo")
              signalTxt = "\u76EE\u6807\u5728\u8DEF\u53E3\u77ED\u6682\u505C\u7559\uFF0C\u8BB0\u5F55\u5176\u6B63\u9762\u7279\u5F81";
            else if (firstAction.id === "scan")
              signalTxt = "\u76EE\u6807\u73AF\u987E\u56DB\u5468\uFF0C\u4FA7\u5411\u8EAB\u5F62\u6E05\u6670";
            else if (firstAction.id === "timing")
              signalTxt = "\u89C2\u5BDF\u5176\u4E3E\u6B62\u795E\u6001\uFF0C\u6355\u6349\u9632\u5907\u677E\u61C8\u95F4\u9699";
            else if (firstAction.id === "shop_enter")
              signalTxt = "\u76EE\u6807\u8FDB\u5165\u6CBF\u8857\u5546\u94FA\uFF0C\u9A7B\u8DB3\u8D27\u67B6\u524D";
            else signalTxt = "\u76EE\u6807\u4FDD\u6301\u884C\u8FDB\uFF0C\u4F60\u5728\u4FA7\u540E\u65B9\u89C2\u5BDF\u8BB0\u5F55";
          }
          if (signalTxt) {
            g.signals = g.signals || [];
            g.signals.push([tm, signalTxt]);
            if (g.signals.length > 20) g.signals.shift();
          }
          for (const key of Object.keys(floorApplied))
            floorApplied[key] = L.get(key) - beforeLedger[key];
          const parts = [];
          if (floorApplied.stamina)
            parts.push(
              `\u4F53\u529B ${floorApplied.stamina > 0 ? "+" : ""}${floorApplied.stamina}`
            );
          if (floorApplied.heart)
            parts.push(
              `\u5FC3\u8DF3 ${floorApplied.heart > 0 ? "+" : ""}${floorApplied.heart}`
            );
          if (floorApplied.alert)
            parts.push(
              `\u8B66\u89C9 ${floorApplied.alert > 0 ? "+" : ""}${floorApplied.alert}`
            );
          if (floorApplied.pi)
            parts.push(`PI ${floorApplied.pi > 0 ? "+" : ""}${floorApplied.pi}`);
          if (floorApplied.proximity)
            parts.push(
              `\u63A5\u8FD1\u5EA6 ${floorApplied.proximity > 0 ? "+" : ""}${floorApplied.proximity}`
            );
          if (floorApplied.cash)
            parts.push(
              `\u73B0\u91D1 ${floorApplied.cash > 0 ? "+" : ""}${floorApplied.cash}`
            );
          g.lastLedgerSummary = parts.length > 0 ? `\u672C\u8F6E\u7ED3\u7B97 \xB7 ${parts.join(" \xB7 ")}` : "\u672C\u8F6E\u7ED3\u7B97 \xB7 \u65E0\u6570\u503C\u53D8\u52A8";
          for (const t of tags.filter((t2) => t2.type === "fact")) {
            const issued = g.tickets.find((k) => k.no === t.ticket);
            results.facts.push({ ticket: t.ticket, consumed: !!issued });
          }
          if (!opts._fromInput) g.tickets = [];
          results.floorApplied = floorApplied;
          results.stats = snapshot();
          results.capture = g.capture || null;
          results.flow = g.logs.slice();
          return results;
        }
        function processReply(llmText) {
          const { tags, cleanText, diag } = parseFloor(llmText, lex);
          const mode = tags.find((t) => t.type === "mode");
          if (mode) g.mode = mode.mode;
          const claims = tags.filter((t) => t.type === "lie").map((t) => ({ ...t, verified: verifyEvidence(cleanText, t.claim) }));
          const facts = tags.filter((t) => t.type === "fact").map((t) => ({
            ticket: t.ticket,
            consumed: g.tickets.some((k) => String(k.no) === String(t.ticket))
          }));
          const consumed = new Set(
            facts.filter((t) => t.consumed).map((t) => String(t.ticket))
          );
          g.tickets = g.tickets.filter((t) => !consumed.has(String(t.no)));
          return {
            floor: g.floor,
            actions: [],
            facts,
            lies: claims,
            mode: mode?.mode || null,
            diag,
            stats: snapshot()
          };
        }
        return {
          rollEnvSfx,
          translateInput,
          settleInput,
          processFloor,
          processReply
        };
      }
      module.exports = { createTurnSystem };
    }
  });

  // src/runtime/facts.js
  var require_facts2 = __commonJS({
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

  // src/runtime/game/player.js
  var require_player = __commonJS({
    "src/runtime/game/player.js"(exports, module) {
      "use strict";
      var R = require_rules();
      var T = require_tags();
      var C = require_checks();
      var facts = require_facts2();
      function createPlayerSystem({ g, L, log }) {
        function sweetHighNow() {
          const advNrv = (g.tags || []).some((t) => t.id === "adv_nrv");
          return R.check.sweetHigh + (advNrv ? R.advantage.sweetHighBonus : 0);
        }
        function syncHeartTags() {
          const lines = C.heartLines(L.get("heart"), sweetHighNow());
          const stack = g.tags || (g.tags = []);
          if (lines.deform === -2)
            T.apply(stack, {
              id: "deform",
              name: "\u64CD\u4F5C\u53D8\u5F62",
              owner: "player",
              category: "fine",
              effects: [{ category: "fine", value: -2 }],
              duration: { type: "flag" }
            });
          else if (lines.deform === 0) T.remove(stack, "deform");
          if (lines.crash)
            T.apply(stack, {
              id: "crash",
              name: "\u64CD\u4F5C\u5D29\u6E83",
              owner: "player",
              category: "fine",
              effects: [{ category: "fine", value: -2 }],
              duration: { type: "flag" }
            });
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
              g.player.inventory.push({
                id: def.startKit.item,
                count: 1,
                equipped: false
              });
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
            {
              id: "adv_agi",
              name: "\u4F18\u52BF\uFF1A\u654F\u6377",
              on: g.player.agi >= A.attrThreshold
            },
            {
              id: "adv_str",
              name: "\u4F18\u52BF\uFF1A\u4F53\u683C",
              on: g.player.str >= A.attrThreshold
            },
            {
              id: "adv_cha",
              name: "\u4F18\u52BF\uFF1A\u53E3\u624D",
              on: g.player.cha >= A.attrThreshold
            },
            {
              id: "adv_nrv",
              name: "\u4F18\u52BF\uFF1A\u80C6\u91CF",
              on: g.player.nrv >= A.attrThreshold
            }
          ];
          for (const d of defs) {
            if (d.on)
              T.apply(stack, {
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
            {
              id: "bulky",
              name: "\u8EAB\u5F62\u9192\u76EE",
              owner: "player",
              category: "stealth",
              value: -1,
              on: g.player.str >= 8
            },
            {
              id: "unobtrusive",
              name: "\u4E0D\u8D77\u773C",
              owner: "player",
              category: "stealth",
              value: 1,
              on: g.player.str <= 3
            },
            {
              id: "light_footed",
              name: "\u811A\u6B65\u8F7B",
              owner: "player",
              category: "stealth",
              value: 2,
              on: g.player.agi >= 8
            },
            {
              id: "clumsy",
              name: "\u7B28\u62D9",
              owner: "player",
              category: "stealth",
              value: -2,
              on: g.player.agi <= 3
            },
            {
              id: "stammer",
              name: "\u7ED3\u5DF4",
              owner: "player",
              category: "social",
              value: -2,
              on: g.player.cha <= 2 && L.get("heart") > 70
            }
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
        return {
          sweetHighNow,
          syncHeartTags,
          applyIdentity,
          addProxLog,
          identityShift,
          syncThresholdTags
        };
      }
      module.exports = { createPlayerSystem };
    }
  });

  // src/runtime/game/inventory.js
  var require_inventory = __commonJS({
    "src/runtime/game/inventory.js"(exports, module) {
      "use strict";
      var R = require_rules();
      var T = require_tags();
      var { HUNTER_MODES } = require_constants();
      function createInventorySystem({ g, L, log, syncHeartTags }) {
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
          const it = g.player.inventory.find(
            (i) => i.id === itemId && (i.count || 1) > 0
          );
          if (!it) return { ok: false, reason: "\u884C\u56CA\u4E2D\u65E0\u6B64\u53EF\u7528\u6D88\u8017\u54C1" };
          const def = R.items && R.items[itemId];
          if (!def || def.type !== "consumable")
            return { ok: false, reason: "\u8BE5\u7269\u54C1\u4E0D\u662F\u6D88\u8017\u54C1" };
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
            L.commit(
              { stamina: staminaGain, heart: 10 },
              { reason: "item_energy_drink" }
            );
            syncHeartTags();
            log(`[\u884C\u56CA] \u996E\u7528\u80FD\u91CF\u996E\u6599\uFF1A\u4F53\u529B+${staminaGain}\uFF0C\u5FC3\u60B8\u5FC3\u8DF3+10`);
            return {
              ok: true,
              msg: "\u996E\u7528\u80FD\u91CF\u996E\u6599\uFF1A\u4F53\u529B+20\uFF0C\u5FC3\u60B8\u5FC3\u8DF3+10",
              stamina: staminaGain,
              heart: 10
            };
          }
          if (itemId === "bento") {
            removeItem(itemId, 1);
            const staminaMax = g.player.staminaMax || 100 + (g.player.str || 4) * 5;
            const curStam = L.get("stamina");
            const staminaGain = Math.min(20, staminaMax - curStam);
            L.commit({ stamina: staminaGain }, { reason: "item_bento" });
            log(`[\u884C\u56CA] \u98DF\u7528\u4FBF\u5F53\uFF1A\u4F53\u529B+${staminaGain}`);
            return {
              ok: true,
              msg: `\u98DF\u7528\u4FBF\u5F53\uFF1A\u4F53\u529B+${staminaGain}`,
              stamina: staminaGain
            };
          }
          if (itemId === "onigiri") {
            removeItem(itemId, 1);
            const staminaMax = g.player.staminaMax || 100 + (g.player.str || 4) * 5;
            const curStam = L.get("stamina");
            const staminaGain = Math.min(8, staminaMax - curStam);
            L.commit({ stamina: staminaGain }, { reason: "item_onigiri" });
            log(`[\u884C\u56CA] \u98DF\u7528\u996D\u56E2\uFF1A\u4F53\u529B+${staminaGain}`);
            return {
              ok: true,
              msg: `\u98DF\u7528\u996D\u56E2\uFF1A\u4F53\u529B+${staminaGain}`,
              stamina: staminaGain
            };
          }
          if (itemId === "coffee") {
            removeItem(itemId, 1);
            log(`[\u884C\u56CA] \u996E\u7528\u70ED\u5496\u5561\uFF1A\u65E0\u6570\u503C\u52A0\u6210`);
            return { ok: true, msg: "\u996E\u7528\u70ED\u5496\u5561\uFF1A\u65E0\u6570\u503C\u52A0\u6210" };
          }
          return { ok: false, reason: "\u6682\u672A\u5B9E\u88C5\u8BE5\u6D88\u8017\u54C1\u4F7F\u7528\u6548\u679C" };
        }
        return {
          syncEquippedTags,
          addItem,
          removeItem,
          equipItem,
          unequipItem,
          useItem
        };
      }
      module.exports = { createInventorySystem };
    }
  });

  // src/runtime/game/checks.js
  var require_checks2 = __commonJS({
    "src/runtime/game/checks.js"(exports, module) {
      "use strict";
      var R = require_rules();
      var T = require_tags();
      var C = require_checks();
      var D = require_dice();
      function createCheckSystem({ g, seedFor, isFamiliar }) {
        function targetEffectiveAcuity() {
          const acuityMod = T.summarize(g.tags || [], "acuity").sum;
          return Math.max(1, Math.min(10, (g.target.per || 4) + acuityMod));
        }
        function gain({ threat = null, dist = g.dist, stim = 0 }) {
          const alertD = threat ? C.alertDelta({
            threat,
            dist,
            env: g.env,
            acuity: targetEffectiveAcuity(),
            familiar: isFamiliar()
          }) : 0;
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
          const advTagged = (g.tags || []).some(
            (t) => t.id === "adv_" + attrKeyOf(entry.id)
          );
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
          const ATTR_NAMES = {
            agi: "\u654F\u6377",
            str: "\u4F53\u683C",
            int: "\u60C5\u62A5",
            cha: "\u53E3\u624D",
            nrv: "\u80C6\u91CF"
          };
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
          const fine = [
            "photo",
            "record",
            "pick",
            "ransack",
            "lockpick",
            "plant_bug",
            "cover_tracks"
          ];
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
        return { targetEffectiveAcuity, gain, runCheck, categoryOf };
      }
      module.exports = { createCheckSystem };
    }
  });

  // src/runtime/game/route.js
  var require_route = __commonJS({
    "src/runtime/game/route.js"(exports, module) {
      "use strict";
      var { clockMinutes } = require_clock();
      var map = require_map();
      var LP = require_lifepack();
      var TS = require_target_state();
      function createRouteSystem({ g, seedAt, applyTargetState }) {
        function setRoute(route) {
          g.route = route;
          if (g.targetState && route && route.nodes) {
            const curId = route.nodes[route.here || 0];
            const curName = curId ? map.getPlace(curId)?.name || curId : null;
            const pack = LP.packs && LP.packs[g.targetId] || LP.packs.college || LP.packs.student;
            g.targetState.hand = TS.resolveHand(
              pack,
              curId,
              g.targetState.hand,
              seedAt(g.floor || 0, "hand_set_route")
            );
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
              g.targetState.hand = TS.resolveHand(
                pack,
                toId,
                g.targetState.hand,
                seedAt(g.floor || 0, "hand_adv_" + g.route.here)
              );
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
        function routeClockMin(floor) {
          return clockMinutes(g, floor);
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
          if (!r || !Array.isArray(r.nodes) || !Array.isArray(r.times) || !r.times.length)
            return r ? r.here || 0 : -1;
          if (g.alertHold > 0) {
            g.alertHold -= 1;
            return r.here || 0;
          }
          const now = routeClockMin(g.floor || 1);
          const from = r.here || 0;
          while (r.here < r.nodes.length - 1) {
            let t = null, previous = 0;
            for (let index = 0; index <= r.here + 1; index++) {
              t = hhmmToMin(r.times[index]);
              if (t === null) break;
              while (t < previous) t += 1440;
              previous = t;
            }
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
          if (g.route && g.route.known && i >= 0 && i < g.route.known.length)
            g.route.known[i] = 1;
        }
        return { setRoute, herAdvance, advanceRouteByClock, revealNode };
      }
      module.exports = { createRouteSystem };
    }
  });

  // src/runtime/game/alert.js
  var require_alert = __commonJS({
    "src/runtime/game/alert.js"(exports, module) {
      "use strict";
      var R = require_rules();
      var C = require_checks();
      var D = require_dice();
      var { DIST_DOWN, DIST_CN } = require_constants();
      function createAlertSystem({
        g,
        L,
        seedAt,
        log,
        targetEffectiveAcuity,
        herAdvance
      }) {
        function alertBranch() {
          const nrv = g.target.nrv || 4, per = g.target.per || 4;
          if (nrv > per) return "turn";
          if (per > nrv) return "detour";
          const roll = D.rollD20(seedAt(g.floor || 1, "alert_branch")).d20;
          return roll <= 7 ? "turn" : roll <= 14 ? "detour" : "shop";
        }
        function applyAlertBehavior(stage) {
          const floor = g.floor || 1;
          const ev = { stage, floor, kind: "", detail: "" };
          if (stage === 1) {
            const roll = D.rollD20(seedAt(floor, "alert_pace")).d20;
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
                const her = D.rollD20(seedAt(floor, "alert_turn_her")).d20 + targetEffectiveAcuity();
                const me = D.rollD20(seedAt(floor, "alert_turn_me")).d20 + (g.player.agi || 0);
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
        return { resolveAlertCross };
      }
      module.exports = { createAlertSystem };
    }
  });

  // src/runtime/game/album.js
  var require_album2 = __commonJS({
    "src/runtime/game/album.js"(exports, module) {
      "use strict";
      var D = require_dice();
      var ALBUM = require_album();
      var map = require_map();
      var { CA_CN } = require_constants();
      function createAlbumSystem({ g, seedAt }) {
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
          const seed = seedAt(g.floor || 1, "capture_" + g.captureSeq);
          const pick = cands[g.rngVersion === 1 ? D.rollD20(seed).d20 % cands.length : D.pickIndex(seed, cands.length)];
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
          g.signals.push([
            "\u7167\u7247",
            `\u62CD\u5230 ${pick.item.name}\uFF08${CA_CN[pick.angle] || pick.angle}\uFF09`
          ]);
          if (g.signals.length > 20) g.signals.shift();
          return g.lastCapture;
        }
        return { capturePhoto };
      }
      module.exports = { createAlbumSystem };
    }
  });

  // src/config/economy.json
  var require_economy = __commonJS({
    "src/config/economy.json"(exports, module) {
      module.exports = {
        nativeMultiplier: 1.2,
        nativeJobs: {
          otaku: "remote",
          guard: "guard_shift",
          bartender: "bar_shift"
        },
        jobs: {
          mover: {
            name: "\u642C\u573A\u96F6\u5DE5",
            attr: "str",
            base: 280,
            pass: 420,
            great: 560,
            stamina: 40
          },
          remote: {
            name: "\u8FDC\u7A0B\u63A5\u5355",
            attr: "int",
            base: 220,
            pass: 308,
            great: 440,
            stamina: 0
          },
          guard_shift: {
            name: "\u4FDD\u5B89\u5F53\u73ED",
            attr: "nrv",
            base: 320,
            fixed: true,
            stamina: 0
          },
          bar_shift: {
            name: "\u9152\u5427\u5F53\u73ED",
            attr: "cha",
            base: 300,
            pass: 390,
            stamina: 0,
            pending: "\u665A\u73ED\u5360\u7528\u5C3E\u884C\u7A97\u53E3\u7684\u89C4\u5219\u5C1A\u672A\u63A5\u901A"
          },
          delivery: {
            name: "\u9001\u5916\u5356",
            attr: "agi",
            base: 240,
            pass: 336,
            great: 480,
            stamina: 0,
            pending: "\u66DD\u5149\u6982\u7387\u5C1A\u672A\u786E\u5B9A\uFF0C\u6682\u4E0D\u5F00\u653E\u7ED3\u7B97"
          }
        },
        commerce: {
          maxCartLines: 20,
          maxQuantity: 99,
          maxOrders: 64,
          deliveryDays: {
            consumable: 0,
            tool: 1,
            tech: 1,
            device: 1,
            disguise: 1,
            gear: 0
          }
        }
      };
    }
  });

  // src/runtime/economy/shop.js
  var require_shop = __commonJS({
    "src/runtime/economy/shop.js"(exports, module) {
      "use strict";
      var RULES = require_rules();
      var CONFIG = require_economy().commerce;
      var clone = (x) => JSON.parse(JSON.stringify(x));
      var error = (message) => Object.assign(Error(message), { code: "DAY_UNAVAILABLE" });
      function catalog(ctx, channel = "retail") {
        if (!["retail", "black_market"].includes(channel))
          throw error("\u672A\u77E5\u8D2D\u7269\u6E20\u9053");
        if (channel === "black_market" && !RULES.identity.list[ctx.identity]?.blackMarket)
          throw error("\u5F53\u524D\u8EAB\u4EFD\u6CA1\u6709\u9ED1\u5E02\u6E20\u9053");
        return Object.values(RULES.items).filter(
          (item) => Object.prototype.hasOwnProperty.call(CONFIG.deliveryDays, item.type) && Number.isSafeInteger(item.price) && item.price > 0
        ).map((item) => {
          const equipment = CONFIG.deliveryDays[item.type] > 0;
          const discount = channel === "black_market" && equipment ? RULES.identity.blackMarketDiscount : 0;
          return {
            id: item.id,
            name: item.name,
            type: item.type,
            unitPrice: Math.round(item.price * (1 - discount)),
            deliveryDays: CONFIG.deliveryDays[item.type],
            note: item.type === "device" ? "\u8D2D\u4E70\u4EC5\u5165\u5E93\uFF0C\u8BBE\u5907\u5B89\u88C5\u529F\u80FD\u5F85\u63A5" : item.effectsDesc || "",
            owned: (ctx.player.inventory || []).find((x) => x.id === item.id)?.count || 0
          };
        });
      }
      var handler = {
        available: () => null,
        view: (ctx) => ({
          type: "shop",
          cash: ctx.ledger.cash,
          channels: [
            { id: "retail", name: "\u5546\u573A" },
            ...RULES.identity.list[ctx.identity]?.blackMarket ? [{ id: "black_market", name: "\u9ED1\u5E02\uFF08\u5668\u6750\u4E5D\u6298\uFF09" }] : []
          ],
          catalogs: {
            retail: catalog(ctx),
            ...RULES.identity.list[ctx.identity]?.blackMarket ? { black_market: catalog(ctx, "black_market") } : {}
          },
          maxQuantity: CONFIG.maxQuantity,
          maxCartLines: CONFIG.maxCartLines,
          note: "\u4E00\u6279\u91C7\u4E70\u6D88\u8017 1 \u70B9\uFF1B\u666E\u901A\u54C1\u5F53\u6B21\u5165\u5E93\uFF0C\u5668\u6750\u9694\u65E5\u5230\u8D27\u3002"
        }),
        prepare(ctx, args) {
          if (!Array.isArray(args.cart) || !args.cart.length || args.cart.length > CONFIG.maxCartLines)
            throw error("\u8BF7\u9009\u62E9\u5546\u54C1\uFF0C\u8D2D\u7269\u6E05\u5355\u4E0D\u80FD\u4E3A\u7A7A\u6216\u8D85\u957F");
          const channel = args.channel || "retail", items = new Map(catalog(ctx, channel).map((x) => [x.id, x])), quantities = /* @__PURE__ */ new Map();
          for (const line of args.cart) {
            if (!line || !items.has(line.id) || !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > CONFIG.maxQuantity)
              throw error("\u5546\u54C1\u6216\u6570\u91CF\u65E0\u6548");
            const qty = (quantities.get(line.id) || 0) + line.quantity;
            if (qty > CONFIG.maxQuantity) throw error("\u540C\u4E00\u5546\u54C1\u6570\u91CF\u8FC7\u591A");
            quantities.set(line.id, qty);
          }
          const lines = [...quantities].map(([id, quantity]) => {
            const item = items.get(id);
            return {
              id,
              quantity,
              unitPrice: item.unitPrice,
              dueDate: ctx.ledger.date + item.deliveryDays,
              delivered: item.deliveryDays === 0
            };
          });
          const total = lines.reduce(
            (sum, line) => sum + line.unitPrice * line.quantity,
            0
          );
          if (!Number.isSafeInteger(total) || ctx.ledger.cash < total)
            throw error("\u73B0\u91D1\u4E0D\u8DB3\uFF0C\u672C\u6B21\u672A\u6263\u8D39");
          const economy = clone(ctx.economy);
          if (economy.orders.length >= CONFIG.maxOrders) {
            const index = economy.orders.findIndex(
              (o) => o.lines.every((l) => l.delivered)
            );
            if (index < 0) throw error("\u5F85\u6536\u8D27\u8BA2\u5355\u5DF2\u6EE1\uFF0C\u8BF7\u5148\u7B49\u5F85\u5230\u8D27");
            economy.orders.splice(index, 1);
          }
          economy.orders.push({
            id: `order-${ctx.ledger.date}-${ctx.dayPlan.sequence || 0}`,
            date: ctx.ledger.date,
            total,
            channel,
            lines
          });
          const inventory = lines.filter((l) => l.delivered).map((l) => ({ id: l.id, add: l.quantity }));
          const delayed = lines.some((l) => !l.delivered);
          return {
            summary: `\u91C7\u4E70\u5B8C\u6210\uFF0C\u652F\u4ED8 ${total}${delayed ? "\uFF1B\u5668\u6750\u5C06\u5728\u4E0B\u4E00\u5929\u5230\u8D27" : "\uFF1B\u5546\u54C1\u5DF2\u5165\u5E93"}`,
            ledger: { cash: -total },
            inventory,
            economy
          };
        }
      };
      function deliverDue(ctx, date) {
        const economy = clone(ctx.economy), counts = /* @__PURE__ */ new Map();
        for (const order of economy.orders)
          for (const line of order.lines) {
            if (!line.delivered && line.dueDate <= date) {
              counts.set(line.id, (counts.get(line.id) || 0) + line.quantity);
              line.delivered = true;
            }
          }
        const inventory = [...counts].map(([id, add]) => ({ id, add }));
        return {
          summary: inventory.length ? `\u6536\u5230 ${inventory.reduce((s, l) => s + l.add, 0)} \u4EF6\u5230\u8D27\u5546\u54C1` : "",
          inventory,
          economy
        };
      }
      function economyView(economy) {
        return {
          workedOn: economy.workedOn,
          lastWork: economy.lastWork,
          orders: economy.orders.slice().reverse().map((o) => ({
            ...o,
            lines: o.lines.map((l) => ({ ...l, name: RULES.items[l.id].name }))
          }))
        };
      }
      module.exports = { catalog, handler, deliverDue, economyView };
    }
  });

  // src/config/day-plan.json
  var require_day_plan = __commonJS({
    "src/config/day-plan.json"(exports, module) {
      module.exports = {
        budget: 4,
        tailingCost: 2,
        periods: [
          { id: "morning", name: "\u65E9\u95F4", short: "\u65E9" },
          { id: "midday", name: "\u5348\u95F4", short: "\u4E2D" },
          { id: "afternoon", name: "\u5348\u540E", short: "\u5348" },
          { id: "evening", name: "\u665A\u95F4", short: "\u665A" },
          { id: "midnight", name: "\u5B50\u591C", short: "\u5B50" }
        ]
      };
    }
  });

  // src/contracts/day-plan.js
  var require_day_plan2 = __commonJS({
    "src/contracts/day-plan.js"(exports, module) {
      "use strict";
      var RULES = require_day_plan();
      var copy = (value) => JSON.parse(JSON.stringify(value));
      function createDayPlan(slot = "e21_23") {
        const period = slot === "prepare" ? 2 : ["e23_01", "late"].includes(slot) ? 4 : 3;
        return {
          schema: 1,
          period,
          spent: 0,
          activity: null,
          ended: false,
          source: "legacy"
        };
      }
      function validateDayPlan(value) {
        if (!value || value.schema !== 1 || !Number.isInteger(value.period) || value.period < 0 || value.period >= RULES.periods.length || !Number.isInteger(value.spent) || value.spent < 0 || value.spent > RULES.budget || typeof value.ended !== "boolean" || !["legacy", "daily"].includes(value.source))
          throw Object.assign(new Error("\u65E5\u7A0B\u6570\u636E\u65E0\u6548"), { code: "SAVE_INVALID" });
        if (value.sequence !== void 0 && (!Number.isInteger(value.sequence) || value.sequence < 0))
          throw Object.assign(new Error("\u65E5\u7A0B\u7248\u672C\u65E0\u6548"), { code: "SAVE_INVALID" });
        if (value.receipts !== void 0 && (!Array.isArray(value.receipts) || value.receipts.length > 32 || value.receipts.some(
          (r) => !r || typeof r.operationId !== "string" || typeof r.requestKey !== "string" || typeof r.summary !== "string"
        )))
          throw Object.assign(new Error("\u65E5\u7A0B\u56DE\u6267\u65E0\u6548"), { code: "SAVE_INVALID" });
        const a = value.activity;
        if (a !== null && (!a || typeof a.id !== "string" || !a.id || a.id.length > 128 || !["routine", "tailing"].includes(a.kind) || typeof a.name !== "string" || !a.name || a.name.length > 64 || !Number.isInteger(a.cost) || a.cost < 0 || a.cost > RULES.budget || a.cost > value.spent || a.kind === "tailing" && a.cost !== RULES.tailingCost))
          throw Object.assign(new Error("\u65E5\u7A0B\u6D3B\u52A8\u6570\u636E\u65E0\u6548"), {
            code: "SAVE_INVALID"
          });
        if (value.ended && (value.period !== RULES.periods.length - 1 || a !== null))
          throw Object.assign(new Error("\u65E5\u7A0B\u7ED3\u675F\u72B6\u6001\u65E0\u6548"), {
            code: "SAVE_INVALID"
          });
        return copy(value);
      }
      function dayPlanView(value, date) {
        const state = validateDayPlan(value);
        return {
          ...state,
          date,
          budget: RULES.budget,
          remaining: RULES.budget - state.spent,
          tailingCost: RULES.tailingCost,
          periodName: RULES.periods[state.period].name
        };
      }
      module.exports = {
        DAY_PLAN_RULES: RULES,
        createDayPlan,
        validateDayPlan,
        dayPlanView
      };
    }
  });

  // src/runtime/game/snapshot.js
  var require_snapshot = __commonJS({
    "src/runtime/game/snapshot.js"(exports, module) {
      "use strict";
      var { classifyPlace } = require_action_requirements();
      var { economyView } = require_shop();
      var R = require_rules();
      var C = require_checks();
      var map = require_map();
      var F = require_facts2();
      var ALBUM = require_album();
      var { dayPlanView } = require_day_plan2();
      var { WEATHER_ICON, SHOE_DIST_FACTOR } = require_constants();
      function createSnapshotSystem({
        g,
        L,
        syncTargetShoeTags,
        applyShoeMod,
        identityShift,
        rollEnvSfx,
        getDayActivities,
        getDayToken,
        getDayControls
      }) {
        function snapshot() {
          const s = L.state;
          const w = g.world;
          const districtObj = map.getDistrict(w.district);
          const here = g.route ? g.route.here : -1;
          const curId = g.route && here >= 0 ? g.route.nodes[here] : null;
          const cur = curId ? map.getPlace(curId) : null;
          const nextId = g.route && here >= 0 && here + 1 < g.route.nodes.length ? g.route.nodes[here + 1] : null;
          const dailyIdle = g.dayPlan.source === "daily" && g.dayPlan.activity?.kind !== "tailing";
          const routeView = !dailyIdle && g.route ? {
            id: g.route.id,
            note: g.route.note,
            startTime: g.route.startTime,
            times: g.route.times || null,
            nodes: g.route.nodes.map(
              (id, i) => g.route.known && g.route.known[i] ? map.getPlace(id)?.name || id : id
            ),
            known: g.route.known || g.route.nodes.map(() => 1),
            here
          } : null;
          const exits = cur ? cur.exits.map(
            (id) => (map.getPlace(id)?.name || id) + (id === nextId ? " (\u524D)" : "")
          ) : [];
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
          return JSON.parse(
            JSON.stringify({
              dayPlan: { ...dayPlanView(g.dayPlan, s.date), token: getDayToken() },
              economy: economyView(g.economy),
              dayActions: getDayActivities(),
              dayControls: getDayControls(),
              player: {
                heart: s.heart,
                stamina: s.stamina,
                cash: s.cash,
                pi: s.pi,
                proximity: s.proximity,
                date: s.date,
                attrs: {
                  str: g.player.str,
                  agi: g.player.agi,
                  nrv: g.player.nrv,
                  int: g.player.int,
                  cha: g.player.cha
                }
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
                  for (const k of ["str", "agi", "per", "nrv", "social"])
                    out[k] = base[k];
                  const som = g.targetState && g.targetState.somatic && g.targetState.somatic.mod;
                  if (som)
                    for (const [k, v] of Object.entries(som)) {
                      if (out[k] !== void 0) out[k] = Math.max(1, out[k] + v);
                    }
                  return applyShoeMod(out);
                })(),
                alertStage: C.alertStage(s.alert),
                warinessStage: s.wariness >= 60 ? "\u9AD8" : s.wariness >= 30 ? "\u4E2D" : "\u4F4E",
                shoe: activeShoe,
                /* 鞋具读数（状态栏悬停用）：鞋型 + 敏捷修正 + 步声基准 + 按距离折算的当前声级 */
                shoeInfo: (() => {
                  const id = (g.tags || []).find(
                    (t) => t.owner === "target" && t.id && t.id.startsWith("shoe_")
                  )?.id;
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
              profile: {
                targetId: g.targetId,
                attrs: {},
                // No persisted attribute-discovery system exists yet.
                impressions: [],
                facts: F.view(g.targetId, {
                  pi: s.pi,
                  tickets: [],
                  assignedFacts: g.targetPersona?.assignedFacts
                })?.facts || []
              },
              envSfx,
              placeKind: classifyPlace(curId, cur?.name || ""),
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
              tags: (g.tags || []).map((t) => ({
                id: t.id,
                name: t.name,
                owner: t.owner,
                type: t.type || "status",
                duration: t.duration.type,
                count: t.duration.count
              })),
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
              signal: g.signals?.slice(-8) || [],
              proxLog: g.proxLogs && g.proxLogs.length > 0 ? g.proxLogs.slice(-5).reverse() : [],
              assess: g.lastAssess || null,
              ledger: g.lastLedgerSummary || "\u672C\u8F6E\u6682\u65E0\u7ED3\u7B97",
              /* 地图 HUD 字段（状态栏 route-tracker + 战术沙盘） */
              area: districtObj ? districtObj.name : "\u672A\u77E5",
              place: !dailyIdle && cur && routeView.known[here] ? cur.name : dailyIdle ? "\u65E5\u7A0B\u5B89\u6392" : null,
              weather: w.weather,
              weatherName: dailyIdle && g.dayPlan.period < 3 && w.weather === "clear" ? "\u6674\u5929" : WEATHER_ICON[w.weather] || "\u{1F319} \u6674\u591C",
              strikeSealed: cur ? !!cur.strike_sealed : false,
              fam: w.district ? g.famSegs[w.district] || 0 : 0,
              route: routeView,
              exits: dailyIdle ? [] : exits,
              spots: !dailyIdle && cur ? cur.spots || [] : [],
              sanctuaryAlert: dailyIdle ? "" : sanctuaryAlert,
              /* 相册：计数 + 已拍清单（贴墙渲染用） */
              album: (() => {
                const persona = g.targetPersona || {};
                const shots = Object.entries(g.album || {}).map(([k, v]) => ({
                  key: k,
                  ...v
                }));
                return { count: shots.length, total: ALBUM.totalFor(persona), shots };
              })(),
              capture: g.capture || null
            })
          );
        }
        return { snapshot };
      }
      module.exports = { createSnapshotSystem };
    }
  });

  // src/runtime/game/save.js
  var require_save = __commonJS({
    "src/runtime/game/save.js"(exports, module) {
      "use strict";
      function createSaveSystem({ g, L, getSalt }) {
        function save() {
          return JSON.parse(
            JSON.stringify({
              v: 2,
              dayPlan: g.dayPlan,
              economy: g.economy,
              rngVersion: g.rngVersion,
              nightStartFloor: g.nightStartFloor || 0,
              envSfx: g._envSfx ?? null,
              sessionSalt: getSalt(),
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
            })
          );
        }
        return { save };
      }
      module.exports = { createSaveSystem };
    }
  });

  // src/contracts/economy.js
  var require_economy2 = __commonJS({
    "src/contracts/economy.js"(exports, module) {
      "use strict";
      var RULES = require_rules();
      var CONFIG = require_economy().commerce;
      var clone = (x) => JSON.parse(JSON.stringify(x));
      var invalid = () => Object.assign(Error("\u5DE5\u4F5C\u6216\u8BA2\u5355\u5B58\u6863\u65E0\u6548\uFF0C\u539F\u8FDB\u5EA6\u5DF2\u4FDD\u7559"), {
        code: "SAVE_INVALID"
      });
      var integer = (v, min = 0) => Number.isSafeInteger(v) && v >= min;
      function createEconomy() {
        return { schema: 1, workedOn: null, lastWork: null, orders: [] };
      }
      function validateEconomy(value) {
        if (!value || value.schema !== 1 || value.workedOn !== null && !integer(value.workedOn, 1) || !Array.isArray(value.orders) || value.orders.length > CONFIG.maxOrders)
          throw invalid();
        if (value.lastWork !== null && (!value.lastWork || !integer(value.lastWork.date, 1) || typeof value.lastWork.jobId !== "string" || !integer(value.lastWork.income) || typeof value.lastWork.name !== "string" || value.workedOn !== value.lastWork.date))
          throw invalid();
        const seen = /* @__PURE__ */ new Set();
        for (const order of value.orders) {
          if (!order || typeof order.id !== "string" || !order.id || seen.has(order.id) || !integer(order.date, 1) || !integer(order.total, 1) || !["retail", "black_market"].includes(order.channel) || !Array.isArray(order.lines) || !order.lines.length || order.lines.length > CONFIG.maxCartLines)
            throw invalid();
          seen.add(order.id);
          let total = 0;
          const items = /* @__PURE__ */ new Set();
          for (const line of order.lines) {
            if (!line || !Object.prototype.hasOwnProperty.call(RULES.items, line.id) || items.has(line.id) || !integer(line.quantity, 1) || line.quantity > CONFIG.maxQuantity || !integer(line.unitPrice, 1) || !integer(line.dueDate, order.date) || typeof line.delivered !== "boolean")
              throw invalid();
            items.add(line.id);
            total += line.unitPrice * line.quantity;
          }
          if (!Number.isSafeInteger(total) || total !== order.total) throw invalid();
        }
        return clone(value);
      }
      module.exports = { createEconomy, validateEconomy };
    }
  });

  // src/config/daily-actions.json
  var require_daily_actions = __commonJS({
    "src/config/daily-actions.json"(exports, module) {
      module.exports = [
        { id: "daily.rest", name: "\u4F11\u606F", cost: 1, mode: "instant", kind: "routine", handler: "rest", effect: "\u6062\u590D 50 \u70B9\u4F53\u529B\uFF0C\u4E0D\u8D85\u8FC7\u4E0A\u9650", recovery: 50 },
        { id: "daily.work", name: "\u6253\u5DE5\uFF0F\u63A5\u5355", cost: 1, mode: "instant", kind: "routine", handler: "work", inputRequired: true, effect: "\u6309\u672C\u6B21\u5DE5\u79CD\u7ED3\u7B97\u62A5\u916C\u4E0E\u6D88\u8017" },
        { id: "daily.shop", name: "\u8D2D\u7269", cost: 1, mode: "instant", kind: "routine", handler: "shop", inputRequired: true, effect: "\u4E00\u6B21\u6279\u91CF\u91C7\u4E70\uFF0C\u7ED3\u8D26\u524D\u5217\u660E\u603B\u4EF7" },
        { id: "daily.talk", name: "\u72EC\u7ACB\u4EA4\u6D41", cost: 1, mode: "scene", kind: "routine", handler: "talk", effect: "\u5C55\u5F00\u4E00\u6B21\u4EA4\u6D41\uFF0C\u6210\u679C\u7531\u5177\u4F53\u4E8B\u4EF6\u51B3\u5B9A" },
        { id: "daily.tailing", name: "\u5C3E\u884C", cost: 2, mode: "scene", kind: "tailing", handler: "tailing", effect: "\u8FDB\u5165\u8FDE\u7EED\u5C3E\u884C\u56DE\u5408\uFF0C\u6574\u6BB5\u7ED3\u675F\u540E\u63A8\u8FDB\u65F6\u6BB5" },
        { id: "daily.pass", name: "\u5EA6\u8FC7\u672C\u65F6\u6BB5", cost: 0, mode: "instant", kind: "routine", handler: "pass", effect: "\u65E0\u6536\u76CA\u548C\u6062\u590D\uFF0C\u76F4\u63A5\u8FDB\u5165\u4E0B\u4E00\u65F6\u6BB5" }
      ];
    }
  });

  // src/runtime/economy/work.js
  var require_work = __commonJS({
    "src/runtime/economy/work.js"(exports, module) {
      "use strict";
      var RULES = require_rules();
      var CONFIG = require_economy();
      var error = (message) => Object.assign(Error(message), { code: "DAY_UNAVAILABLE" });
      function workOptions(ctx) {
        const identity = ctx.identity;
        const rows = Object.entries(CONFIG.jobs).map(([id, d]) => ({ id, ...d }));
        for (const [id, d] of Object.entries(RULES.identity.jobs)) {
          const base = d.baseJob ? CONFIG.jobs[d.baseJob] : d;
          rows.push({
            id,
            name: d.name,
            attr: d.attr,
            base: Math.round(base.base * (d.mult || 1)),
            pass: Math.round(base.pass * (d.mult || 1)),
            great: Math.round(base.great * (d.mult || 1)),
            stamina: d.cost?.stamina ?? base.stamina ?? 0,
            exclusive: d.exclusive,
            nativeMultiplier: d.nativeMult || 1
          });
        }
        return rows.map((row) => {
          const native = CONFIG.nativeJobs[identity] === row.id;
          const mult = row.nativeMultiplier || (native ? CONFIG.nativeMultiplier : 1);
          let reason = row.pending || null;
          if (row.exclusive && identity !== row.exclusive) reason = "\u4EC5\u5BF9\u5E94\u8EAB\u4EFD\u53EF\u63A5";
          if (identity === "criminal" && row.id !== "black_labor")
            reason = "\u5F53\u524D\u8EAB\u4EFD\u53EA\u80FD\u63A5\u9ED1\u5DE5";
          if (ctx.economy.workedOn === ctx.ledger.date)
            reason = "\u4ECA\u5929\u5DF2\u7ECF\u5B8C\u6210\u4E00\u73ED\u5DE5\u4F5C";
          if (ctx.ledger.stamina < row.stamina) reason = "\u4F53\u529B\u4E0D\u8DB3\u4EE5\u627F\u62C5\u672C\u6B21\u5DE5\u4F5C";
          if (identity === "guard" && row.id === "guard_shift") {
            const night = Math.floor((ctx.ledger.date - 1) / 7) % 2 === 1;
            if (night ? ctx.dayPlan.period < 3 : ctx.dayPlan.period > 2)
              reason = night ? "\u672C\u5468\u662F\u591C\u73ED\uFF0C\u8BF7\u5728\u665A\u95F4\u6216\u5B50\u591C\u5F53\u73ED" : "\u672C\u5468\u662F\u663C\u73ED\uFF0C\u8BF7\u5728\u767D\u5929\u5F53\u73ED";
          }
          return {
            id: row.id,
            name: row.name,
            income: Math.round(row.base * mult),
            stamina: row.stamina,
            fixed: !!row.fixed,
            enabled: !reason,
            reason,
            note: row.fixed ? "\u56FA\u5B9A\u5DE5\u8D44\uFF0C\u65E0\u9700\u68C0\u5B9A" : `\u5F53\u524D\u6309\u5E95\u85AA\u7ED3\u7B97\uFF1B\u5DF2\u5B9A\u52A0\u85AA\u6863 ${Math.round(row.pass * mult)}${row.great ? " / " + Math.round(row.great * mult) : ""}\uFF0C\u68C0\u5B9A\u95E8\u69DB\u5F85\u5B9A`,
            tiers: {
              base: Math.round(row.base * mult),
              pass: row.pass ? Math.round(row.pass * mult) : null,
              great: row.great ? Math.round(row.great * mult) : null
            }
          };
        });
      }
      var handler = {
        available: (ctx) => workOptions(ctx).some((x) => x.enabled) ? null : ctx.economy.workedOn === ctx.ledger.date ? "\u4ECA\u5929\u5DF2\u7ECF\u5B8C\u6210\u4E00\u73ED\u5DE5\u4F5C" : "\u5F53\u524D\u65F6\u6BB5\u6CA1\u6709\u53EF\u63A5\u5DE5\u4F5C",
        view: (ctx) => ({
          type: "work",
          jobs: workOptions(ctx),
          note: "\u6BCF\u5929\u6700\u591A\u4E00\u73ED\uFF1B\u786E\u8BA4\u540E\u6D88\u8017 1 \u70B9\u5E76\u63A8\u8FDB\u4E00\u4E2A\u65F6\u6BB5\u3002"
        }),
        prepare(ctx, args) {
          const job = workOptions(ctx).find((x) => x.id === args.jobId);
          if (!job) throw error("\u8BF7\u9009\u62E9\u6709\u6548\u5DE5\u79CD");
          if (!job.enabled) throw error(job.reason);
          const economy = JSON.parse(JSON.stringify(ctx.economy));
          economy.workedOn = ctx.ledger.date;
          economy.lastWork = {
            jobId: job.id,
            name: job.name,
            date: ctx.ledger.date,
            income: job.income,
            stamina: job.stamina
          };
          return {
            summary: `${job.name}\u5B8C\u6210\uFF0C\u6536\u5165 ${job.income}\uFF0C\u4F53\u529B\u6D88\u8017 ${job.stamina}`,
            ledger: { cash: job.income, stamina: -job.stamina },
            economy
          };
        }
      };
      module.exports = { workOptions, handler };
    }
  });

  // src/runtime/daily/registry.js
  var require_registry = __commonJS({
    "src/runtime/daily/registry.js"(exports, module) {
      "use strict";
      var definitions = require_daily_actions();
      var { DAY_PLAN_RULES } = require_day_plan2();
      var clone = (value) => JSON.parse(JSON.stringify(value));
      var handlers = {
        rest: {
          available: (ctx) => ctx.ledger.stamina >= ctx.player.staminaMax ? "\u4F53\u529B\u5DF2\u6EE1" : null,
          prepare: (ctx, args, def) => ({
            ledger: {
              stamina: Math.min(
                def.recovery,
                ctx.player.staminaMax - ctx.ledger.stamina
              )
            },
            summary: `\u4F11\u606F\u5B8C\u6210\uFF0C\u6062\u590D ${Math.min(def.recovery, ctx.player.staminaMax - ctx.ledger.stamina)} \u70B9\u4F53\u529B`
          })
        },
        pass: { available: () => null, prepare: () => ({ summary: "\u5DF2\u5EA6\u8FC7\u672C\u65F6\u6BB5" }) },
        work: require_work().handler,
        shop: require_shop().handler,
        talk: { available: () => "\u5F53\u524D\u6CA1\u6709\u53EF\u5F00\u5C55\u7684\u4EA4\u6D41\u4E8B\u4EF6", prepare: null },
        tailing: { available: () => "\u5F53\u524D\u6CA1\u6709\u53EF\u63A5\u5165\u7684\u51FA\u884C\u673A\u4F1A", prepare: null }
      };
      function createDailyRegistry(extensions = []) {
        const entries = /* @__PURE__ */ new Map();
        function add(def, handler) {
          if (!def || typeof def.id !== "string" || !/^daily\.[a-z][a-z0-9_]*$/.test(def.id) || typeof def.name !== "string" || !def.name || !Number.isInteger(def.cost) || def.cost < 0 || def.cost > DAY_PLAN_RULES.budget || !["instant", "scene"].includes(def.mode) || !["routine", "tailing"].includes(def.kind) || def.kind === "tailing" && def.cost !== DAY_PLAN_RULES.tailingCost || typeof def.effect !== "string" || !handler || typeof handler.available !== "function")
            throw Error("\u65E5\u7A0B\u6D3B\u52A8\u6CE8\u518C\u65E0\u6548");
          entries.set(def.id, { definition: clone(def), handler });
        }
        definitions.forEach((def) => add(def, handlers[def.handler]));
        extensions.forEach(({ definition, handler }) => add(definition, handler));
        return { list: () => [...entries.values()], get: (id) => entries.get(id) };
      }
      module.exports = { createDailyRegistry };
    }
  });

  // src/runtime/daily/system.js
  var require_system = __commonJS({
    "src/runtime/daily/system.js"(exports, module) {
      "use strict";
      var {
        DAY_PLAN_RULES,
        createDayPlan,
        validateDayPlan
      } = require_day_plan2();
      var { validateEconomy } = require_economy2();
      var { deliverDue } = require_shop();
      var { LIMITS } = require_ledger();
      var ITEMS = require_rules().items;
      var clone = (value) => JSON.parse(JSON.stringify(value));
      var fail = (code, message) => Object.assign(new Error(message), { code });
      function createDailySystem({
        g,
        L,
        registry,
        nextDay,
        afterCommit = () => {
        }
      }) {
        function context() {
          return clone({
            player: g.player,
            ledger: L.state,
            dayPlan: g.dayPlan,
            world: g.world,
            targetId: g.targetId,
            identity: g.identity,
            economy: g.economy
          });
        }
        function token() {
          return {
            date: L.get("date"),
            period: g.dayPlan.period,
            sequence: g.dayPlan.sequence || 0
          };
        }
        function reason(entry) {
          const p = g.dayPlan;
          if (p.source !== "daily") return "\u8BF7\u5148\u542F\u7528\u65E5\u7A0B\u5B89\u6392";
          if (p.ended) return "\u672C\u65E5\u5DF2\u7ED3\u675F";
          if (p.activity) return "\u8BF7\u5148\u7ED3\u675F\u5F53\u524D\u6D3B\u52A8";
          if (DAY_PLAN_RULES.budget - p.spent < entry.definition.cost)
            return "\u884C\u52A8\u70B9\u4E0D\u8DB3";
          let unavailable;
          try {
            unavailable = entry.handler.available(context());
          } catch {
            return "\u6D3B\u52A8\u6761\u4EF6\u6A21\u5757\u6682\u4E0D\u53EF\u7528";
          }
          if (unavailable) return String(unavailable);
          if (typeof entry.handler.prepare !== "function")
            return "\u5F53\u524D\u6CA1\u6709\u53EF\u6267\u884C\u7684\u6D3B\u52A8\u5185\u5BB9";
          return null;
        }
        function activities() {
          return registry.list().map((entry) => {
            const unavailable = reason(entry);
            let input;
            try {
              input = entry.handler.view?.(context());
            } catch {
              return {
                ...clone(entry.definition),
                enabled: false,
                reason: "\u6D3B\u52A8\u5185\u5BB9\u6682\u4E0D\u53EF\u7528"
              };
            }
            return {
              ...clone(entry.definition),
              ...input ? { input } : {},
              enabled: !unavailable,
              reason: unavailable
            };
          });
        }
        function controls() {
          const p = g.dayPlan;
          if (p.source === "legacy")
            return [
              {
                command: "enable",
                name: "\u8BD5\u7528\u65E5\u7A0B\u5B89\u6392",
                effect: "\u4ECE\u5F53\u524D\u65F6\u6BB5\u5F00\u59CB\uFF1B\u5C3E\u884C\u5165\u573A\u6761\u4EF6\u5F85\u63A5\u901A",
                enabled: !(g.floor > 0 && g.route && g.route.here < g.route.nodes.length - 1),
                reason: "\u8BF7\u5148\u5B8C\u6210\u5F53\u524D\u539F\u6709\u6D41\u7A0B"
              }
            ];
          if (p.ended)
            return [
              {
                command: "next-day",
                name: "\u8FDB\u5165\u4E0B\u4E00\u5929",
                effect: `\u6BCF\u65E5\u6062\u590D ${DAY_PLAN_RULES.budget} \u70B9\uFF0C\u672A\u4F7F\u7528\u7684\u884C\u52A8\u70B9\u4E0D\u4FDD\u7559`,
                enabled: true
              }
            ];
          if (!p.activity) return [];
          const entry = registry.get(p.activity.actionId);
          return ["finish", "cancel"].map((command) => ({
            command,
            name: command === "finish" ? "\u5B8C\u6210\u672C\u6B21\u6D3B\u52A8" : "\u7ED3\u675F\u672C\u6B21\u6D3B\u52A8",
            effect: "\u4E0D\u9000\u8FD8\u5DF2\u6D88\u8017\u70B9\u6570\uFF0C\u8FDB\u5165\u4E0B\u4E00\u65F6\u6BB5",
            enabled: typeof entry?.handler[command] === "function",
            reason: "\u5F53\u524D\u6D3B\u52A8\u7684\u7ED3\u675F\u6761\u4EF6\u5C1A\u672A\u63A5\u901A"
          }));
        }
        function advance(p) {
          if (p.period < DAY_PLAN_RULES.periods.length - 1) p.period++;
          else p.ended = true;
        }
        function applyEffects(result) {
          if (!result || typeof result.summary !== "string")
            throw fail("DAY_EFFECT_INVALID", "\u6D3B\u52A8\u6CA1\u6709\u6709\u6548\u7ED3\u7B97\u7ED3\u679C");
          if (Object.keys(result).some(
            (key) => !["summary", "ledger", "payload", "inventory", "economy"].includes(
              key
            )
          ))
            throw fail("DAY_EFFECT_INVALID", "\u6D3B\u52A8\u542B\u6709\u5C1A\u672A\u652F\u6301\u7684\u6548\u679C\u7C7B\u578B");
          const ledger = result.ledger || {};
          for (const [key, value] of Object.entries(ledger)) {
            if (!Object.prototype.hasOwnProperty.call(LIMITS, key) || key === "date" || !Number.isFinite(value))
              throw fail("DAY_EFFECT_INVALID", "\u6D3B\u52A8\u6570\u503C\u6548\u679C\u65E0\u6548");
            if (L.get(key) + value < LIMITS[key][0] || L.get(key) + value > LIMITS[key][1])
              throw fail("DAY_EFFECT_INVALID", "\u6D3B\u52A8\u6548\u679C\u8D85\u51FA\u6570\u503C\u8303\u56F4");
          }
          const inventory = clone(g.player.inventory || []);
          if (result.inventory !== void 0) {
            if (!Array.isArray(result.inventory) || result.inventory.length > 50)
              throw fail("DAY_EFFECT_INVALID", "\u7269\u54C1\u6548\u679C\u65E0\u6548");
            for (const change of result.inventory) {
              if (!change || !Object.prototype.hasOwnProperty.call(ITEMS, change.id) || !Number.isSafeInteger(change.add) || change.add < 1 || change.add > 999)
                throw fail("DAY_EFFECT_INVALID", "\u7269\u54C1\u6548\u679C\u65E0\u6548");
              const item = inventory.find((i) => i.id === change.id);
              if (item) {
                item.count = (item.count || 1) + change.add;
                if (!Number.isSafeInteger(item.count))
                  throw fail("DAY_EFFECT_INVALID", "\u7269\u54C1\u6570\u91CF\u65E0\u6548");
              } else
                inventory.push({ id: change.id, count: change.add, equipped: false });
            }
          }
          const economy = result.economy === void 0 ? null : validateEconomy(result.economy);
          return { ledger, inventory, economy };
        }
        function execute(request) {
          if (!request || typeof request.operationId !== "string" || !request.operationId || request.operationId.length > 128)
            throw fail("DAY_REQUEST_INVALID", "\u6D3B\u52A8\u8BF7\u6C42\u65E0\u6548");
          let requestKey;
          try {
            requestKey = JSON.stringify(request);
          } catch {
            throw fail("DAY_REQUEST_INVALID", "\u6D3B\u52A8\u8BF7\u6C42\u65E0\u6CD5\u4FDD\u5B58");
          }
          if (typeof requestKey !== "string" || requestKey.length > 8192)
            throw fail("DAY_REQUEST_INVALID", "\u6D3B\u52A8\u8BF7\u6C42\u8FC7\u957F");
          const p = validateDayPlan(g.dayPlan);
          const cached = (p.receipts || []).find(
            (r) => r.operationId === request.operationId
          );
          if (cached) {
            if (cached.command !== request.command || cached.actionId !== (request.actionId || null) || cached.requestKey !== requestKey)
              throw fail("DAY_REQUEST_INVALID", "\u91CD\u590D\u8BF7\u6C42\u5185\u5BB9\u4E0D\u4E00\u81F4");
            return { ...clone(cached), reused: true };
          }
          const expected = request.expected, current = token();
          if (!expected || expected.date !== current.date || expected.period !== current.period || expected.sequence !== current.sequence)
            throw fail("DAY_STALE", "\u65E5\u7A0B\u5DF2\u53D8\u5316\uFF0C\u8BF7\u6309\u5F53\u524D\u72B6\u6001\u91CD\u65B0\u9009\u62E9");
          const before = {
            date: current.date,
            period: p.period,
            remaining: DAY_PLAN_RULES.budget - p.spent
          };
          let next = clone(p), result = { summary: "" }, ledger = {}, inventory = null, economy = null, cost = 0;
          if (request.command === "enable") {
            if (p.source !== "legacy") throw fail("DAY_STALE", "\u65E5\u7A0B\u5DF2\u7ECF\u542F\u7528");
            if ((g.floor || 0) > 0 && g.route && g.route.here < g.route.nodes.length - 1)
              throw fail("DAY_BUSY", "\u8BF7\u5148\u5B8C\u6210\u5F53\u524D\u539F\u6709\u6D41\u7A0B\uFF0C\u518D\u542F\u7528\u65E5\u7A0B\u5B89\u6392");
            next.source = "daily";
            next.spent = 0;
            next.activity = null;
            result.summary = "\u5DF2\u4ECE\u5F53\u524D\u65F6\u6BB5\u542F\u7528\u65E5\u7A0B\u5B89\u6392";
          } else if (request.command === "start") {
            const entry = registry.get(request.actionId);
            if (!entry) throw fail("DAY_UNKNOWN", "\u6CA1\u6709\u8FD9\u9879\u65E5\u7A0B\u6D3B\u52A8");
            const unavailable = reason(entry);
            if (unavailable) throw fail("DAY_UNAVAILABLE", unavailable);
            result = entry.handler.prepare(
              context(),
              clone(request.args || {}),
              clone(entry.definition)
            );
            ({ ledger, inventory, economy } = applyEffects(result));
            cost = entry.definition.cost;
            next.spent += cost;
            if (entry.definition.mode === "scene") {
              next.activity = {
                id: request.operationId,
                actionId: entry.definition.id,
                kind: entry.definition.kind,
                name: entry.definition.name,
                cost,
                payload: clone(result.payload || {})
              };
            } else advance(next);
          } else if (["finish", "cancel"].includes(request.command)) {
            if (p.source !== "daily" || !p.activity || request.activityId !== p.activity.id)
              throw fail("DAY_STALE", "\u5F53\u524D\u6D3B\u52A8\u5DF2\u7ECF\u53D8\u5316");
            const entry = registry.get(p.activity.actionId);
            if (!entry) throw fail("DAY_UNKNOWN", "\u5F53\u524D\u6D3B\u52A8\u7684\u5904\u7406\u6A21\u5757\u4E0D\u53EF\u7528");
            const handler = request.command === "finish" ? entry.handler.finish : entry.handler.cancel;
            if (typeof handler !== "function")
              throw fail("DAY_UNAVAILABLE", "\u5F53\u524D\u6D3B\u52A8\u6682\u4E0D\u80FD\u5728\u8FD9\u91CC\u7ED3\u675F");
            result = handler(context(), clone(request.args || {}), clone(p.activity));
            ({ ledger, inventory, economy } = applyEffects(result));
            next.activity = null;
            advance(next);
          } else if (request.command === "next-day") {
            if (p.source !== "daily" || !p.ended || p.activity)
              throw fail("DAY_UNAVAILABLE", "\u8BF7\u5148\u7ED3\u675F\u5F53\u5929\u7684\u5B89\u6392");
            const arrivals = deliverDue(context(), L.get("date") + 1);
            ({ ledger, inventory, economy } = applyEffects(arrivals));
            const outcome = nextDay();
            if (outcome?.blocked) throw fail("DAY_BUSY", outcome.reason);
            next = {
              ...createDayPlan(),
              source: "daily",
              period: 0,
              receipts: p.receipts || []
            };
            result.summary = `\u65B0\u7684\u4E00\u5929\u5F00\u59CB\uFF0C\u884C\u52A8\u70B9\u6062\u590D\u81F3 ${DAY_PLAN_RULES.budget} \u70B9${arrivals.summary ? "\uFF1B" + arrivals.summary : ""}`;
          } else throw fail("DAY_REQUEST_INVALID", "\u4E0D\u652F\u6301\u7684\u65E5\u7A0B\u64CD\u4F5C");
          next.sequence = (p.sequence || 0) + 1;
          const receipt = {
            operationId: request.operationId,
            command: request.command,
            actionId: request.actionId || null,
            requestKey,
            cost,
            before,
            after: {
              date: L.get("date"),
              period: next.period,
              remaining: DAY_PLAN_RULES.budget - next.spent
            },
            summary: result.summary
          };
          next.receipts = [...next.receipts || [], receipt].slice(-32);
          next.lastReceipt = receipt;
          validateDayPlan(next);
          if (Object.keys(ledger).length)
            L.commit(ledger, { reason: "daily-activity", action: request.actionId });
          if (inventory) g.player.inventory = inventory;
          if (economy) g.economy = economy;
          g.dayPlan = next;
          afterCommit();
          if (!next.activity) {
            g.env = next.period < 3 ? "day" : "night";
            g.slot = next.period < 3 ? "prepare" : next.period === 3 ? "e21_23" : "e23_01";
          }
          return clone(receipt);
        }
        return { activities, controls, execute, token };
      }
      module.exports = { createDailySystem };
    }
  });

  // src/runtime/persistence/migrations.js
  var require_migrations = __commonJS({
    "src/runtime/persistence/migrations.js"(exports, module) {
      "use strict";
      var { LIMITS } = require_ledger();
      var {
        normalizePersona,
        validatePersona
      } = require_persona();
      var { validateDayPlan } = require_day_plan2();
      var CURRENT_SAVE_VERSION = 2;
      function migrateSave(saved) {
        if (!saved || typeof saved !== "object" || ![1, 2].includes(saved.v))
          throw Object.assign(new Error("\u4E0D\u652F\u6301\u7684\u5B58\u6863\u7248\u672C"), {
            code: "SAVE_VERSION_UNSUPPORTED"
          });
        const copy = JSON.parse(JSON.stringify(saved));
        if (!Number.isInteger(copy.floor) || copy.floor < 0 || typeof copy.sessionSalt !== "string" || !copy.ledgerState)
          throw Object.assign(new Error("\u5B58\u6863\u7F3A\u5C11\u6709\u6548\u56DE\u5408\u3001\u968F\u673A\u72B6\u6001\u6216\u8D26\u672C"), {
            code: "SAVE_INVALID"
          });
        for (const [key, [min, max]] of Object.entries(LIMITS)) {
          const value = copy.ledgerState[key];
          if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max)
            throw Object.assign(new Error(`\u5B58\u6863\u8D26\u76EE\u65E0\u6548\uFF1A${key}`), {
              code: "SAVE_INVALID"
            });
        }
        for (const [key, value] of Object.entries(copy.ledgerState))
          if (!Object.prototype.hasOwnProperty.call(LIMITS, key) || typeof value !== "number" || !Number.isFinite(value))
            throw Object.assign(new Error(`\u5B58\u6863\u8D26\u76EE\u65E0\u6548\uFF1A${key}`), {
              code: "SAVE_INVALID"
            });
        if (copy.v === 1) {
          copy.rngVersion ?? (copy.rngVersion = 1);
          copy.nightStartFloor ?? (copy.nightStartFloor = 0);
          copy.v = 2;
        }
        if (![1, 2].includes(copy.rngVersion) || !Number.isInteger(copy.nightStartFloor) || copy.nightStartFloor < 0 || copy.nightStartFloor > copy.floor)
          throw Object.assign(new Error("\u5B58\u6863\u65F6\u95F4\u6216\u968F\u673A\u7248\u672C\u65E0\u6548"), {
            code: "SAVE_INVALID"
          });
        if (copy.dayPlan !== void 0) validateDayPlan(copy.dayPlan);
        copy.targetPersona = normalizePersona(copy.targetPersona);
        validatePersona(copy.targetPersona, copy.targetId || "college", {
          references: false
        });
        return copy;
      }
      module.exports = { CURRENT_SAVE_VERSION, migrateSave };
    }
  });

  // src/runtime/game.js
  var require_game = __commonJS({
    "src/runtime/game.js"(exports, module) {
      var { loadLexicon } = require_lexicon2();
      var D = require_dice();
      var { createLedger } = require_ledger();
      var map = require_map();
      var LP = require_lifepack();
      var TS = require_target_state();
      var ALBUM = require_album();
      var { createTargetSystem } = require_target();
      var { createActionSystem } = require_actions();
      var { createTurnSystem } = require_turn();
      var { createPlayerSystem } = require_player();
      var { createInventorySystem } = require_inventory();
      var { createCheckSystem } = require_checks2();
      var { createRouteSystem } = require_route();
      var { createAlertSystem } = require_alert();
      var { createAlbumSystem } = require_album2();
      var { createSnapshotSystem } = require_snapshot();
      var { createSaveSystem } = require_save();
      var { createEconomy, validateEconomy } = require_economy2();
      var { createDailyRegistry } = require_registry();
      var { createDailySystem } = require_system();
      var { classifyPlace } = require_action_requirements();
      var { migrateSave } = require_migrations();
      var { createDayPlan, validateDayPlan } = require_day_plan2();
      var {
        normalizePersona,
        validatePersona
      } = require_persona();
      function createGame(init = {}, services = {}) {
        if (init.targetPersona) {
          init = { ...init, targetPersona: normalizePersona(init.targetPersona) };
          validatePersona(
            init.targetPersona,
            init.targetId || init.targetPersona.targetId || "college",
            { complete: init.targetPersona.generatorVersion != null }
          );
        }
        if (init.saved) init = { ...init, saved: migrateSave(init.saved) };
        const rngVersion = init.saved?.rngVersion ?? 2;
        const lex = loadLexicon();
        let salt = init.sessionSalt || D.newSessionSalt();
        const g = {
          sessionSalt: salt,
          rngVersion,
          nightStartFloor: init.saved?.nightStartFloor ?? init.nightStartFloor ?? 0,
          player: init.player || {
            str: 4,
            agi: 5,
            nrv: 5,
            int: 5,
            cha: 5,
            staminaMax: 120
          },
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
            const i = D.pickIndex(
              D.actionSeed(salt, 0, "hair", rngVersion),
              ALBUM.WARDROBE.variants.hair.length
            );
            g.targetPersona.hair = ALBUM.WARDROBE.variants.hair[i];
          }
          if (!g.targetPersona.body) {
            const i = D.pickIndex(
              D.actionSeed(salt, 0, "body", rngVersion),
              ALBUM.WARDROBE.variants.body.length
            );
            g.targetPersona.body = ALBUM.WARDROBE.variants.body[i];
          }
        }
        if (g.targetPersona && !g.targetPersona.assignedFacts) {
          const pack = LP.packs && LP.packs[g.targetId] || LP.packs.college || LP.packs.student;
          TS.resolveTargetFacts(
            pack,
            g.targetPersona,
            D.actionSeed(salt, 0, "facts", rngVersion)
          );
        }
        if (g.targetPersona && g.targetPersona.finalStats) {
          g.target = Object.assign({}, g.target, g.targetPersona.finalStats);
        }
        g.targetBase = { ...g.target };
        g.player.inventory = Array.isArray(init.inventory) ? init.inventory : Array.isArray(g.player.inventory) ? g.player.inventory : [];
        g.nightDrinkUsed = !!init.nightDrinkUsed;
        const L = g.ledger = createLedger({ ...init.stats, nrv: g.player.nrv });
        const seedAt = (floor, domain) => D.actionSeed(salt, floor, domain, rngVersion);
        const getSalt = () => salt;
        const {
          sweetHighNow,
          syncHeartTags,
          applyIdentity,
          addProxLog,
          identityShift,
          syncThresholdTags
        } = createPlayerSystem({ g, L, log });
        const {
          syncEquippedTags,
          addItem,
          removeItem,
          equipItem,
          unequipItem,
          useItem
        } = createInventorySystem({ g, L, log, syncHeartTags });
        const {
          applyTargetState,
          applyShoeMod,
          initTargetState,
          syncTargetShoeTags,
          syncPersonaTags,
          nightFall: legacyNightFall
        } = createTargetSystem({ g, L, seedAt, log, syncHeartTags });
        const { targetEffectiveAcuity, gain, runCheck, categoryOf } = createCheckSystem({ g, seedFor, isFamiliar });
        const { setRoute, herAdvance, advanceRouteByClock, revealNode } = createRouteSystem({ g, seedAt, applyTargetState });
        const { resolveAlertCross } = createAlertSystem({
          g,
          L,
          seedAt,
          log,
          targetEffectiveAcuity,
          herAdvance
        });
        const { capturePhoto } = createAlbumSystem({ g, seedAt });
        const { settleAction } = createActionSystem({
          g,
          L,
          lex,
          log,
          capturePhoto,
          currentPlaceKind,
          gain,
          runCheck,
          syncHeartTags
        });
        const {
          rollEnvSfx,
          translateInput,
          settleInput,
          processFloor,
          processReply
        } = createTurnSystem({
          g,
          L,
          lex,
          seedAt,
          log,
          addProxLog,
          advanceRouteByClock,
          applyTargetState,
          categoryOf,
          herAdvance,
          resolveAlertCross,
          settleAction,
          snapshot: () => snapshot(),
          sweetHighNow,
          syncThresholdTags
        });
        const { snapshot } = createSnapshotSystem({
          g,
          L,
          syncTargetShoeTags,
          applyShoeMod,
          identityShift,
          rollEnvSfx,
          getDayActivities: () => dailySystem.activities(),
          getDayToken: () => dailySystem.token(),
          getDayControls: () => dailySystem.controls()
        });
        const { save } = createSaveSystem({ g, L, getSalt });
        applyIdentity(init.identity, {
          targetGym: init.targetGym,
          packId: init.packId
        });
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
          if (s.inventory !== void 0)
            g.player.inventory = JSON.parse(JSON.stringify(s.inventory));
          if (s.tailing !== void 0) g.tailing = s.tailing;
          if (s.nightPiGross) g.nightPiGross = s.nightPiGross;
          g.sessionSalt = salt;
          Object.assign(L.state, s.ledgerState || {});
          g._envSfx = s.envSfx ?? null;
          g.logs = [];
          syncThresholdTags();
          syncEquippedTags();
          syncTargetShoeTags();
          syncPersonaTags();
          applyTargetState();
        }
        g.dayPlan = validateDayPlan(
          init.saved?.dayPlan ?? init.dayPlan ?? createDayPlan(g.slot)
        );
        g.economy = validateEconomy(
          init.saved?.economy ?? init.economy ?? createEconomy()
        );
        const dailySystem = createDailySystem({
          g,
          L,
          registry: createDailyRegistry(services.dailyActions || []),
          nextDay: legacyNightFall,
          afterCommit: syncThresholdTags
        });
        function nightFall() {
          if (g.dayPlan.source === "daily")
            throw Object.assign(new Error("\u8BF7\u5728\u672C\u65E5\u5B89\u6392\u7ED3\u675F\u540E\u4F7F\u7528\u8FDB\u5165\u4E0B\u4E00\u5929"), {
              code: "DAY_UNAVAILABLE"
            });
          const result = legacyNightFall();
          if (!result?.blocked) g.dayPlan = createDayPlan(g.slot);
          return result;
        }
        (function backfillRouteTimes() {
          const r = g.route;
          if (!r || !Array.isArray(r.nodes)) return;
          if (Array.isArray(r.times) && r.times.length === r.nodes.length) return;
          const pack = LP.packs && LP.packs[g.targetId] || LP.packs.college || LP.packs.student;
          const def = (pack.routes || []).find((x) => x.id === r.id);
          if (!def || !Array.isArray(def.path) || def.path.length !== r.nodes.length)
            return;
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
          return D.actionSeed(salt, g.floor || 0, seq, rngVersion);
        }
        function isFamiliar() {
          return L.get("proximity") >= 20 && L.get("proximity") < 40;
        }
        function currentPlaceKind() {
          const id = g.route?.nodes?.[g.route.here] || "";
          return classifyPlace(id, map.getPlace(id)?.name || "");
        }
        function gmSet(changes = {}) {
          const { tailing, ...rest } = changes;
          if (tailing !== void 0) g.tailing = !!tailing;
          return L.commit(rest, { reason: "gm" });
        }
        return {
          processFloor,
          settleInput,
          processReply,
          translateInput,
          executeDailyCommand: dailySystem.execute,
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

  // src/contracts/chat-scope.js
  var require_chat_scope = __commonJS({
    "src/contracts/chat-scope.js"(exports, module) {
      "use strict";
      function scopeKey(characterId, chatId) {
        return chatId == null || chatId === "" ? null : JSON.stringify([characterId ?? null, String(chatId)]);
      }
      module.exports = { scopeKey };
    }
  });

  // src/host/environment.js
  var require_environment = __commonJS({
    "src/host/environment.js"(exports, module) {
      "use strict";
      var { scopeKey } = require_chat_scope();
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
        if (typeof globalThis !== "undefined" && !list.includes(globalThis))
          list.push(globalThis);
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
              if (w && typeof w.insertOrAssignVariables === "function" && typeof w.getVariables === "function")
                return w;
            } catch (e) {
            }
            try {
              const th = w && w.TavernHelper;
              if (th && typeof th.insertOrAssignVariables === "function" && typeof th.getVariables === "function")
                return th;
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
        const subscriptions = [];
        let eventsDisposed = false;
        const onEvent = (name, fn) => {
          const callback = fn;
          fn = (...args) => {
            if (!eventsDisposed) return callback(...args);
          };
          for (const w of frames) {
            try {
              if (typeof w.eventOn === "function" && w.tavern_events && w.tavern_events[name]) {
                const subscription = w.eventOn(w.tavern_events[name], fn);
                subscriptions.push(
                  () => subscription?.stop?.() ?? w.eventRemoveListener?.(w.tavern_events[name], fn)
                );
                return true;
              }
            } catch (e) {
            }
            try {
              const th = w.TavernHelper;
              if (th && typeof th.eventOn === "function" && th.tavern_events && th.tavern_events[name]) {
                const subscription = th.eventOn(th.tavern_events[name], fn);
                subscriptions.push(
                  () => subscription?.stop?.() ?? th.eventRemoveListener?.(th.tavern_events[name], fn)
                );
                return true;
              }
            } catch (e) {
            }
            try {
              if (w.eventSource && typeof w.eventSource.on === "function") {
                const eventName = w.event_types?.[name] || String(name).toLowerCase();
                w.eventSource.on(eventName, fn);
                subscriptions.push(
                  () => (w.eventSource.removeListener || w.eventSource.off)?.call(
                    w.eventSource,
                    eventName,
                    fn
                  )
                );
                return true;
              }
            } catch (e) {
            }
          }
          for (const w of frames) {
            try {
              const ctx = w.SillyTavern?.getContext?.();
              const source = ctx?.eventSource;
              if (source?.on) {
                const event = ctx.eventTypes?.[name] || ctx.event_types?.[name] || String(name).toLowerCase();
                source.on(event, fn);
                subscriptions.push(
                  () => (source.removeListener || source.off)?.call(source, event, fn)
                );
                return true;
              }
            } catch {
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
              await helperInject(
                arr.map((b) => ({
                  id: b.id,
                  position: POS_HELPER[b.position] || "in_chat",
                  depth: Number.isFinite(b.depth) ? b.depth : 1,
                  role: ROLE_HELPER[b.role] || "system",
                  content: b.content
                }))
              );
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
        const readContext = async () => {
          let ctx = null;
          for (const w of frames) {
            try {
              if (typeof w.SillyTavern?.getContext === "function") {
                ctx = w.SillyTavern.getContext();
                break;
              }
            } catch {
            }
          }
          const helperChatId = pick("getCurrentChatId");
          const chatId = ctx?.chatId ?? ctx?.chat_id ?? (helperChatId ? await helperChatId() : null);
          const characterId = ctx?.characterId ?? ctx?.this_chid ?? null;
          const scope = scopeKey(characterId, chatId);
          const history = Array.isArray(ctx?.chat) ? ctx.chat.map((m, index) => ({
            id: m.message_id ?? index,
            role: m.is_user ? "user" : m.is_system ? "system" : "assistant",
            text: String(m.mes ?? m.message ?? m.content ?? ""),
            swipe: m.swipe_id ?? null
          })) : null;
          return { scope, history };
        };
        return {
          vars,
          readContext,
          dispose: () => {
            eventsDisposed = true;
            for (const stop of subscriptions.splice(0)) {
              try {
                stop();
              } catch {
              }
            }
          },
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
      module.exports = {
        hostFrames,
        findTavernHelper,
        detectApi,
        extractLlmText,
        hostFn,
        hostCharacterData
      };
    }
  });

  // src/host/initial-state.js
  var require_initial_state = __commonJS({
    "src/host/initial-state.js"(exports, module) {
      "use strict";
      var LP = require_lifepack();
      var R = require_rules();
      function defaultInit(overrides = {}) {
        const targetId = overrides && overrides.targetId || "college";
        const targetPersona = overrides && overrides.targetPersona || null;
        const pack = LP.packs && LP.packs[targetId];
        const targetDef = R.targets && R.targets.list && R.targets.list[targetId] || R.targets && R.targets.list && R.targets.list.student;
        let route = null;
        if (pack && pack.routes) {
          const evening = pack.routes.find(
            (r) => r.id === "college_evening" || r.id === "workday_evening"
          ) || pack.routes[0];
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
        let targetStats = pack ? { ...pack.stats, social: pack.social } : {
          ...targetDef.stats || { str: 3, agi: 4, per: 5, nrv: 4 },
          social: targetDef.social || 2
        };
        if (targetPersona && targetPersona.finalStats) {
          targetStats = Object.assign(targetStats, targetPersona.finalStats);
        }
        let district = "B";
        if (targetId === "club") district = "C";
        else if (targetId === "wife") district = "D";
        return {
          targetId,
          ...overrides.dailyMode ? {
            dayPlan: {
              schema: 1,
              source: "daily",
              period: 3,
              spent: 0,
              activity: null,
              ended: false
            }
          } : {},
          targetPersona,
          player: { str: 3, agi: 5, nrv: 5, int: 5, cha: 2, staminaMax: 115 },
          target: targetStats,
          stats: { date: 1, heart: 30, stamina: 100, cash: 800, pi: 0 },
          world: { weather: "clear", district },
          route
        };
      }
      module.exports = { defaultInit };
    }
  });

  // src/host/receipt.js
  var require_receipt = __commonJS({
    "src/host/receipt.js"(exports, module) {
      "use strict";
      var BAND_CN = {
        success: "\u6210\u529F",
        grace: "\u52C9\u5F3A",
        fail: "\u5931\u8D25",
        nat1: "\u5929\u71361",
        nat20: "\u5927\u6210\u529F"
      };
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
        lines.push(
          `[\u7AD9\u4F4D\u4E0E\u6A21\u5F0F] \u4EA4\u4E92\u6A21\u5F0F\uFF1A${modeDesc}\uFF5C\u76F8\u5BF9\u8DDD\u79BB\uFF1A${distDesc}${sanc}`
        );
        if (pkg.narrativeOnly) {
          lines.push(
            "\u672C\u8F6E\u73A9\u5BB6\u672A\u70B9\u9009\u4EFB\u4F55\u52A8\u4F5C\u80F6\u56CA\uFF1A\u7EAF\u53D9\u4E8B\u63A8\u8FDB\uFF0C\u4E0D\u5F97\u51ED\u7A7A\u53D1\u751F\u68C0\u5B9A\u6216\u4F53\u529B/\u5FC3\u8DF3/\u8B66\u89C9\u53D8\u52A8\u3002"
          );
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
              if (actName.includes("\u6F5C\u884C") || actName.includes("\u85CF\u533F"))
                detail = "\u8E29\u4E2D\u79EF\u6C34\u6216\u788E\u6742\u7269\u5F15\u53D1\u7EC6\u5FAE\u52A8\u9759\uFF0C\u5F15\u8D77\u53CD\u5149\u6CE8\u610F";
              else if (actName.includes("\u62CD\u7167") || actName.includes("\u6253\u91CF") || actName.includes("\u89C2\u5BDF"))
                detail = "\u89C6\u7EBF\u88AB\u96E8\u4F1E\u4E0E\u884C\u4EBA\u7269\u4EF6\u906E\u6321\uFF0C\u89D2\u5EA6\u4E0D\u4F73";
              else if (actName.includes("\u9501") || actName.includes("\u64AC"))
                detail = "\u9501\u82AF\u9508\u6B7B\u5361\u6DA9\uFF0C\u53D1\u51FA\u91D1\u5C5E\u78B0\u649E\u8106\u54CD";
              else detail = "\u53D7\u9650\u4E8E\u73B0\u573A\u73AF\u5883\u7A81\u53D1\u5E72\u6270\uFF0C\u52A8\u4F5C\u53D7\u963B";
            }
            lines.push(
              `- ${actName}\uFF1A${bandStr}${detail ? "\uFF08" + detail + "\uFF09" : ""}`
            );
          }
        }
        if (pkg.alertEvent) {
          lines.push(
            `- \u5979\u7684\u8FC7\u6863\u53CD\u5E94\uFF1A${pkg.alertEvent.kind}\uFF08${pkg.alertEvent.detail}\uFF09`
          );
        }
        if (pkg.capture) {
          const cn = {
            front: "\u6B63\u9762",
            side: "\u4FA7\u9762",
            back: "\u80CC\u9762",
            "three-quarter": "\u659C\u4FA7"
          };
          const al = pkg.stats && pkg.stats.album ? pkg.stats.album : null;
          lines.push(
            `- \u62CD\u7167\u6210\u679C\uFF1A${pkg.capture.name} \xB7 ${cn[pkg.capture.angle] || pkg.capture.angle}` + (al ? `\uFF08\u76F8\u518C ${al.count}/${al.total}\uFF09` : "") + `\uFF1BPI +${pkg.capture.piBonus}`
          );
        }
        const fails = (pkg.actions || []).filter(
          (a) => a.band === "fail" || a.band === "crit_fail"
        );
        if (fails.length) {
          const failNames = fails.map((a) => a.label || a.name).join("\u3001");
          lines.push(
            `\u3010\u53D9\u4E8B\u65AD\u70B9\u539F\u5219\u3011\uFF1A\u73A9\u5BB6\u8F93\u5165\u7684\u5185\u5BB9\u4EC5\u4E3A\u5176\u201C\u4E3B\u89C2\u9884\u60F3\u4E0E\u52A8\u4F5C\u5C1D\u8BD5\u201D\u3002\u5224\u5B9A\u4E3A\u672A\u8FBE\u6210\uFF08${failNames} \u5931\u8D25/\u610F\u5916\uFF09\uFF0C\u73A9\u5BB6\u63CF\u5199\u7684\u6210\u529F\u9884\u60F3\u672A\u53D1\u751F\uFF01\u8BF7\u5728\u6B63\u6587\u627F\u63A5\u5C1D\u8BD5\u7EC6\u8282\uFF0C\u968F\u5373\u63CF\u5199\u7A81\u53D1\u610F\u5916\u963B\u788D\u4E0E\u771F\u5B9E\u632B\u6298\u540E\u679C\u3002`
          );
        }
        if (ts) {
          lines.push("\u3010\u76EE\u6807\u5F53\u524D\u6001\u52BF\u4E0E\u884C\u4E3A\u7126\u70B9\uFF08\u767D\u63CF\u7EA6\u675F\uFF09\u3011");
          const defaultTargetName = st.targetId === "college" ? "\u6797\u82E5\u96EA" : "\u9648\u96E8\u5A77";
          const targetName = st.target && (st.target.realName || st.target.name) || ts.targetName || defaultTargetName;
          if (st.target) {
            lines.push(`- \u76EE\u6807\u4EBA\u7269\uFF1A${targetName}`);
          }
          if (ts.route) {
            const curLoc = ts.route.currentPlace ? `[${ts.route.currentPlace}] ` : "";
            const noteStr = ts.route.note ? `[${ts.route.note}] ` : "";
            lines.push(
              `- \u52A8\u7EBF\u60C5\u5883\uFF1A${curLoc}${noteStr}${ts.route.prompt || ""}`.trim()
            );
          }
          if (placeName) {
            lines.push(
              `- \u5F53\u524D\u4F4D\u7F6E\uFF1A[${placeName}]\uFF08\u672C\u697C\u5979\u53EA\u5728\u8FD9\u91CC\uFF1B\u4E25\u7981\u628A\u5979\u5199\u5230\u522B\u7684\u573A\u6240\uFF0C\u4E5F\u4E25\u7981\u63D0\u524D\u62B5\u8FBE\u4E0B\u4E00\u7AD9\u2014\u2014\u5730\u70B9\u53D8\u66F4\u53EA\u8BA4\u56DE\u6267\u91CC\u7684\u300C\u76EE\u6807\u52A8\u5411\u63A8\u8FDB\u300D\uFF09`
            );
          }
          if (ts.outfit) {
            lines.push(
              `- \u5F53\u524D\u7740\u88C5\uFF1A[${ts.outfit.name}] ${ts.outfit.desc}\u3002${ts.outfit.prompt || ""}`
            );
          }
          if (ts.somatic) {
            const modStr = Object.entries(ts.somatic.mod || {}).map(([k, v]) => `${k.toUpperCase()} ${v > 0 ? "+" : ""}${v}`).join(" ");
            lines.push(
              `- \u60C5\u7EEA\u8EAB\u5FC3\uFF1A[${ts.somatic.name}] ${ts.somatic.reason}${modStr ? `\uFF08${modStr}\uFF09` : ""}\u3002${ts.somatic.prompt || ""}`
            );
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
        lines.push(
          "\u7EAA\u5F8B\uFF1A\u5355\u8F6E\u6B63\u6587\u4EC5\u9650\u5F53\u524D\u573A\u6240\u7EA6 1~2 \u5206\u949F\u5FAE\u89C2\u5207\u7247\uFF0C\u63CF\u5199\u5B8C\u6700\u65B0\u52A8\u9759\u540E\u5373\u523B\u5B9A\u683C\uFF1B\u672C\u8F6E\u52A8\u4F5C\u4E0E\u6570\u503C\u5DF2\u7531\u4E2D\u63A7\u5C01\u8D26\uFF0C\u6B63\u6587\u7167\u6B64\u56DE\u6267\u6F14\u7ECE\uFF0C\u6210\u8D25\u4E0D\u5F97\u7BE1\u6539\uFF1B\u6587\u672B\u6309\u89C4\u7533\u62A5\u4E8B\u5B9E\u3002"
        );
        return lines.join("\n");
      }
      module.exports = { receiptText };
    }
  });

  // src/host/daily-context.js
  var require_daily_context = __commonJS({
    "src/host/daily-context.js"(exports, module) {
      "use strict";
      function dailyContextText(snap) {
        const p = snap.dayPlan;
        const last = p.lastReceipt?.summary;
        return [
          "\u3010\u65E5\u7A0B\u72B6\u6001 \xB7 \u672C\u5730\u5B58\u6863\u4E3A\u51C6\u3011",
          `\u7B2C ${p.date} \u5929\uFF0C${p.periodName}\uFF0C\u884C\u52A8\u70B9 ${p.remaining}/${p.budget}\u3002`,
          p.activity ? `\u5F53\u524D\u6D3B\u52A8\uFF1A${p.activity.name}\u3002` : p.ended ? "\u672C\u65E5\u5DF2\u7ED3\u675F\uFF0C\u7B49\u5F85\u8FDB\u5165\u4E0B\u4E00\u5929\u3002" : "\u5F53\u524D\u6CA1\u6709\u8FDB\u884C\u4E2D\u7684\u6D3B\u52A8\u3002",
          last ? `\u6700\u8FD1\u5DF2\u7ED3\u7B97\u6D3B\u52A8\uFF1A${last}` : "\u5C1A\u65E0\u5DF2\u7ED3\u7B97\u7684\u65E5\u7A0B\u6D3B\u52A8\u3002",
          "\u73A9\u5BB6\u8F93\u5165\u4EC5\u4E3A\u4F34\u968F\u53D9\u4E8B\u3002\u4E0D\u5F97\u51ED\u6587\u5B57\u6263\u70B9\u3001\u63A8\u8FDB\u65F6\u6BB5\u3001\u53D1\u653E\u91D1\u94B1\u7269\u54C1\u6216\u89E3\u9501\u60C5\u62A5\uFF1B\u5B9E\u9645\u7ED3\u679C\u53EA\u8BA4\u672C\u5730\u6D3B\u52A8\u56DE\u6267\u3002",
          "\u5F53\u524D\u4E0D\u5904\u4E8E\u5C3E\u884C\u9636\u6BB5\u3002\u4E0D\u5F97\u628A\u591C\u95F4\u8DEF\u7EBF\u5F53\u4F5C\u773C\u524D\u573A\u666F\uFF0C\u4E0D\u5F97\u9ED8\u8BA4\u76EE\u6807\u5C31\u5728\u73A9\u5BB6\u9762\u524D\uFF0C\u4E0D\u5F97\u628A\u672A\u89E3\u9501\u60C5\u62A5\u5199\u6210\u73A9\u5BB6\u5DF2\u7ECF\u638C\u63E1\u3002",
          "\u53EF\u4EE5\u63CF\u5199\u73AF\u5883\u3001\u65E5\u5E38\u7EC6\u8282\u4E0E\u5DF2\u53D1\u751F\u7684\u6D3B\u52A8\uFF0C\u4E0D\u5F97\u53E6\u884C\u5BA3\u5E03\u672A\u6267\u884C\u7684\u6D3B\u52A8\u6210\u529F\u3002"
        ].join("\n");
      }
      module.exports = { dailyContextText };
    }
  });

  // src/host/worldbook.js
  var require_worldbook = __commonJS({
    "src/host/worldbook.js"(exports, module) {
      "use strict";
      var { findTavernHelper, hostCharacterData } = require_environment();
      var R = require_rules();
      var TARGET_ENTRY_NAMES = {
        student: "\u3010\u76EE\u6807\u6863\u6848\u3011\u665A\u81EA\u4E60\u5973\u9AD8\u4E2D\u751F",
        college: "\u3010\u76EE\u6807\u6863\u6848\u3011\u72EC\u5C45\u5973\u5927\u5B66\u751F",
        ol: "\u3010\u76EE\u6807\u6863\u6848\u3011\u5916\u4F01\u804C\u573A\u5973\u6027",
        club: "\u3010\u76EE\u6807\u6863\u6848\u3011\u591C\u573A\u966A\u9152\u5973\u516C\u5173",
        wife: "\u3010\u76EE\u6807\u6863\u6848\u3011\u72EC\u5C45\u5168\u804C\u5C11\u5987"
      };
      async function syncTargetWorldbook(targetId = "college", guard = async () => {
      }) {
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
              if (bindings && Array.isArray(bindings.additional))
                names.push(...bindings.additional);
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
              attempts.push(
                "\u8BFB " + name + " \u2192 " + (Array.isArray(got) ? got.length : 0) + " \u6761"
              );
              if (Array.isArray(got) && got.some((e) => /^【目标档案】/.test(e.name || e.comment || ""))) {
                bookName = name;
                entries = got;
                break;
              }
            } catch (e) {
              attempts.push("\u8BFB " + name + " \u5931\u8D25: " + (e && e.message));
            }
          }
          if (!bookName)
            return {
              skipped: true,
              reason: "\u6CA1\u627E\u5230\u5E26\u3010\u76EE\u6807\u6863\u6848\u3011\u7684\u4E16\u754C\u4E66",
              attempts
            };
          const targetEntries = entries.filter(
            (e) => /^【目标档案】/.test(e.name || e.comment || "")
          );
          const configuredName = R.targets.list[targetId]?.worldbookEntry || TARGET_ENTRY_NAMES[targetId];
          const activeEntry = targetEntries.find(
            (e) => (e.content || "").match(/\[TARGET_GROUP:\s*([a-z_]+)\s*\]/)?.[1] === targetId || (e.name || e.comment || "") === configuredName
          );
          const activeName = activeEntry ? activeEntry.name || activeEntry.comment : null;
          const targetMissing = !activeEntry;
          let changed = false;
          const updated = entries.map((e) => {
            const label = e.name || e.comment || "";
            if (/^【目标档案】/.test(label)) {
              const shouldEnable = label === activeName;
              const shouldConstant = shouldEnable;
              if (e.enabled !== shouldEnable || e.constant !== shouldConstant || e.disable !== !shouldEnable) {
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
          if (!changed)
            return {
              ok: true,
              name: bookName,
              targetId,
              activeName,
              targetMissing,
              unchanged: true,
              attempts
            };
          await guard();
          await helper.replaceWorldbook(bookName, updated, { render: "immediate" });
          console.log(
            `[M4][\u4E16\u754C\u4E66] \u76EE\u6807\u6761\u76EE\u540C\u6B65\u6210\u529F\uFF1A${activeName || "\u65E0\u5339\u914D\u6863\u6848\uFF0C\u5168\u90E8\u76EE\u6807\u6761\u76EE\u5173\u95ED"}\uFF0C\u5176\u4F59\u7981\u7528`
          );
          return {
            ok: true,
            name: bookName,
            targetId,
            activeName,
            targetMissing,
            attempts
          };
        } catch (err) {
          console.warn(
            "[M4][\u4E16\u754C\u4E66] \u76EE\u6807\u6761\u76EE\u540C\u6B65\u5F02\u5E38\uFF1A",
            err && (err.message || err)
          );
          return { ok: false, error: err && err.message, attempts };
        }
      }
      module.exports = { syncTargetWorldbook };
    }
  });

  // src/host/opening.js
  var require_opening = __commonJS({
    "src/host/opening.js"(exports, module) {
      "use strict";
      var { hostCharacterData, hostFn, hostFrames } = require_environment();
      var OPENING_SOURCE = { college: "first_mes", student: "alt:0" };
      async function applyTargetOpening(targetId, guard = async () => {
      }) {
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
        if (count !== null && count > 1)
          return { skipped: true, reason: "\u804A\u5929\u5DF2\u6709\u5185\u5BB9\uFF0C\u4E0D\u8986\u76D6\u5F00\u573A" };
        try {
          await guard();
          await setMsgs([{ message_id: 0, message: text }], { refresh: "affected" });
          return { ok: true, swapped: targetId };
        } catch (e) {
          return { ok: false, error: e && e.message };
        }
      }
      module.exports = { applyTargetOpening };
    }
  });

  // src/host/chat-sync/keys.js
  var require_keys = __commonJS({
    "src/host/chat-sync/keys.js"(exports, module) {
      "use strict";
      module.exports = Object.freeze({
        VAR_SAVE: "wx_save",
        VAR_SNAP: "wx_snap",
        VAR_INIT: "wx_init",
        VAR_CONF: "wx_conf",
        VAR_TIMELINE: "wx_timeline",
        VAR_BACKUP: "wx_sync_backup",
        VAR_DIAG: "wx_diag"
      });
    }
  });

  // src/host/chat-sync/repository.js
  var require_repository = __commonJS({
    "src/host/chat-sync/repository.js"(exports, module) {
      "use strict";
      var {
        VAR_SAVE,
        VAR_SNAP,
        VAR_INIT,
        VAR_CONF,
        VAR_DIAG,
        VAR_TIMELINE,
        VAR_BACKUP
      } = require_keys();
      function createChatRepository(vars) {
        return {
          read: () => vars.read(),
          writeSnapshot: ({ save, snap, diagnostics, timeline, backup, init }) => vars.assign({
            ...init === void 0 ? {} : { [VAR_INIT]: init },
            [VAR_SAVE]: save,
            [VAR_SNAP]: snap,
            [VAR_DIAG]: diagnostics,
            ...timeline === void 0 ? {} : { [VAR_TIMELINE]: timeline },
            ...backup === void 0 ? {} : { [VAR_BACKUP]: backup }
          }),
          begin: (init) => vars.assign({ [VAR_INIT]: init, [VAR_SAVE]: null }),
          reset: (backup) => vars.assign({
            [VAR_INIT]: null,
            [VAR_SAVE]: null,
            [VAR_SNAP]: null,
            [VAR_DIAG]: null,
            [VAR_TIMELINE]: null,
            [VAR_BACKUP]: backup
          }),
          writeConf: (conf) => vars.assign({ [VAR_CONF]: conf })
        };
      }
      module.exports = { createChatRepository };
    }
  });

  // src/host/chat-sync/diagnostics.js
  var require_diagnostics = __commonJS({
    "src/host/chat-sync/diagnostics.js"(exports, module) {
      "use strict";
      function createSyncDiagnostics({ now = Date.now, limit = 24 } = {}) {
        let sequence = 0;
        const events = [];
        function record(stage, details = {}) {
          events.push({ sequence: ++sequence, at: now(), stage, ...details });
          if (events.length > limit) events.shift();
        }
        function failure(stage, code, cause) {
          record(stage, { code });
          const error = new Error(`[CHAT_SYNC:${code}] ${stage}`, { cause });
          error.code = code;
          return error;
        }
        function snapshot() {
          return { schema: 1, events: JSON.parse(JSON.stringify(events)) };
        }
        return { record, failure, snapshot };
      }
      module.exports = { createSyncDiagnostics };
    }
  });

  // src/host/chat-sync/session.js
  var require_session = __commonJS({
    "src/host/chat-sync/session.js"(exports, module) {
      "use strict";
      function createSession(readContext, onChange) {
        let epoch = 0, scope;
        async function capture() {
          const context = await readContext();
          const key = context?.scope ?? null;
          if (scope !== key) {
            const initialized = scope !== void 0;
            scope = key;
            epoch++;
            onChange(context, initialized);
          }
          return {
            epoch,
            scope: key,
            context: context || { scope: null, history: null }
          };
        }
        async function check(token) {
          const current = await capture();
          if (token.epoch !== epoch || token.scope !== current.scope)
            throw Object.assign(new Error("\u804A\u5929\u5DF2\u5207\u6362\uFF0C\u65E7\u4EFB\u52A1\u5DF2\u53D6\u6D88"), {
              code: "STALE_SESSION"
            });
          return current.context;
        }
        return {
          capture,
          check,
          invalidate() {
            epoch++;
          },
          get epoch() {
            return epoch;
          }
        };
      }
      module.exports = { createSession };
    }
  });

  // src/host/chat-sync/timeline.js
  var require_timeline = __commonJS({
    "src/host/chat-sync/timeline.js"(exports, module) {
      "use strict";
      var clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
      function fingerprint(value) {
        const text = typeof value === "string" ? value : JSON.stringify(value);
        return [2166136261, 2246822507, 3266489909, 668265263].map((seed) => {
          let h = seed;
          for (let i = 0; i < text.length; i++)
            h = Math.imul(h ^ text.charCodeAt(i), 16777619);
          return (h >>> 0).toString(16).padStart(8, "0");
        }).join("");
      }
      function tokens(history) {
        return history.map(
          (m, index) => fingerprint([m.id ?? index, m.role, m.text || "", m.swipe ?? null])
        );
      }
      var prefix = (a, b) => a.length <= b.length && a.every((v, i) => v === b[i]);
      function userIndex(history, id) {
        if (!Array.isArray(history)) return -1;
        if (id !== void 0 && id !== null)
          return history.findIndex(
            (m) => m.role === "user" && String(m.id) === String(id)
          );
        for (let i = history.length - 1; i >= 0; i--)
          if (history[i].role === "user") return i;
        return -1;
      }
      function newTimeline(save, history, owner, beforeUser) {
        const index = beforeUser === void 0 ? -1 : userIndex(history, beforeUser);
        const baseHistory = index >= 0 ? history.slice(0, index) : history;
        return {
          schema: 1,
          owner,
          revision: 0,
          base: { path: tokens(baseHistory || []), save: clone(save) },
          nodes: []
        };
      }
      function validPath(path) {
        return Array.isArray(path) && path.every((v) => typeof v === "string" && /^[a-f0-9]{32}$/.test(v));
      }
      function validateTimeline(value) {
        if (!value || value.schema !== 1 || !value.base?.save || !validPath(value.base.path) || !Array.isArray(value.nodes) || !Number.isInteger(value.revision) || value.revision < 0)
          throw Object.assign(new Error("\u65F6\u95F4\u7EBF\u6570\u636E\u635F\u574F\u6216\u7248\u672C\u4E0D\u652F\u6301"), {
            code: "TIMELINE_INVALID"
          });
        for (const n of value.nodes)
          if (!n || !validPath(n.path) || !prefix(value.base.path, n.path) || n.replyPath != null && (!validPath(n.replyPath) || !prefix(n.path, n.replyPath)) || typeof n.key !== "string" || n.key !== fingerprint(n.path) || !n.before || !n.afterInput || !n.after || !n.result)
            throw Object.assign(new Error("\u56DE\u5408\u8BB0\u5F55\u635F\u574F"), {
              code: "TIMELINE_INVALID",
              location: {
                index: Array.isArray(n?.path) ? n.path.length - 1 : void 0,
                kind: "record"
              }
            });
        if (value.locals !== void 0) {
          if (!Array.isArray(value.locals) || value.locals.length > 64)
            throw Object.assign(new Error("\u672C\u5730\u64CD\u4F5C\u68C0\u67E5\u70B9\u5217\u8868\u635F\u574F"), {
              code: "TIMELINE_INVALID"
            });
          const keys = /* @__PURE__ */ new Set();
          for (const c of value.locals) {
            if (!c || !validPath(c.path) || !prefix(value.base.path, c.path) || c.key !== fingerprint(c.path) || keys.has(c.key) || !c.save)
              throw Object.assign(new Error("\u672C\u5730\u64CD\u4F5C\u68C0\u67E5\u70B9\u635F\u574F"), {
                code: "TIMELINE_INVALID",
                location: {
                  index: Array.isArray(c?.path) && c.path.length ? c.path.length - 1 : void 0,
                  kind: "record"
                }
              });
            keys.add(c.key);
          }
        }
        return clone(value);
      }
      function locate(timeline, history) {
        const path = tokens(history);
        if (!prefix(timeline.base.path, path)) {
          let index = 0;
          while (index < path.length && index < timeline.base.path.length && path[index] === timeline.base.path[index])
            index++;
          throw Object.assign(
            new Error("\u804A\u5929\u4FEE\u6539\u65E9\u4E8E\u53EF\u6062\u590D\u7684\u5B58\u6863\u68C0\u67E5\u70B9\uFF0C\u539F\u6863\u5DF2\u4FDD\u7559"),
            {
              code: "HISTORY_OUTSIDE_WINDOW",
              location: {
                index,
                messageId: history[index]?.id,
                kind: index >= path.length ? "missing" : "changed",
                checkpointIndex: timeline.base.path.length - 1
              }
            }
          );
        }
        return { ...select(timeline, path), path };
      }
      function select(timeline, path) {
        let node = null;
        for (const n of timeline.nodes)
          if (prefix(n.path, path) && (!node || n.path.length > node.path.length))
            node = n;
        const replied = node?.replyPath && prefix(node.replyPath, path);
        let save = node ? replied ? node.after : node.afterInput : timeline.base.save;
        let length = node ? replied ? node.replyPath.length : node.path.length : timeline.base.path.length;
        let local = null;
        for (const checkpoint2 of timeline.locals || []) {
          if (prefix(checkpoint2.path, path) && checkpoint2.path.length >= length) {
            save = checkpoint2.save;
            length = checkpoint2.path.length;
            local = checkpoint2;
          }
        }
        return { node, local, save: clone(save) };
      }
      function checkpoint(timeline, history, save, limit = 64) {
        const path = tokens(history), key = fingerprint(path);
        timeline.locals || (timeline.locals = []);
        const index = timeline.locals.findIndex((c) => c.key === key);
        const entry = { path, key, save: clone(save) };
        if (index >= 0) timeline.locals[index] = entry;
        else timeline.locals.push(entry);
        if (timeline.locals.length > limit) {
          const chain = timeline.locals.filter((c) => prefix(c.path, path)).sort((a, b) => a.path.length - b.path.length);
          const cut = chain[Math.max(0, chain.length - Math.floor(limit / 2) - 1)];
          timeline.base = { path: clone(cut.path), save: clone(cut.save) };
          timeline.nodes = timeline.nodes.filter((n) => prefix(cut.path, n.path));
          timeline.locals = timeline.locals.filter((c) => prefix(cut.path, c.path));
        }
      }
      function inputPath(history, messageId) {
        const index = userIndex(history, messageId);
        if (index < 0)
          throw Object.assign(new Error("\u73A9\u5BB6\u6D88\u606F\u5C1A\u672A\u843D\u5165\u5F53\u524D\u804A\u5929"), {
            code: "MESSAGE_NOT_FOUND"
          });
        return tokens(history.slice(0, index + 1));
      }
      function prune(timeline, currentPath, limit = 64) {
        if (timeline.nodes.length <= limit) return;
        const chain = timeline.nodes.filter((n) => prefix(n.path, currentPath)).sort((a, b) => a.path.length - b.path.length);
        const cut = chain[Math.max(0, chain.length - Math.floor(limit / 2) - 1)];
        if (!cut)
          throw Object.assign(new Error("\u65F6\u95F4\u7EBF\u5BB9\u91CF\u4E0D\u8DB3\uFF0C\u539F\u8FDB\u5EA6\u5DF2\u4FDD\u7559"), {
            code: "TIMELINE_FULL"
          });
        const cutPath = cut.replyPath || cut.path;
        timeline.base = {
          path: clone(cutPath),
          save: select(timeline, cutPath).save
        };
        if (timeline.locals)
          timeline.locals = timeline.locals.filter(
            (c) => prefix(timeline.base.path, c.path)
          );
        timeline.nodes = timeline.nodes.filter(
          (n) => prefix(timeline.base.path, n.path)
        );
      }
      module.exports = {
        clone,
        checkpoint,
        fingerprint,
        tokens,
        prefix,
        userIndex,
        newTimeline,
        validateTimeline,
        locate,
        inputPath,
        prune
      };
    }
  });

  // src/contracts/chat-sync-report.js
  var require_chat_sync_report = __commonJS({
    "src/contracts/chat-sync-report.js"(exports, module) {
      "use strict";
      var MESSAGES = {
        HISTORY_OUTSIDE_WINDOW: "\u804A\u5929\u5386\u53F2\u4E0E\u6700\u65E9\u4FDD\u7559\u7684\u68C0\u67E5\u70B9\u4E0D\u540C\uFF0C\u5DF2\u6682\u505C\u8986\u76D6\u5B58\u6863\u3002\u8BF7\u6062\u590D\u76F8\u5E94\u804A\u5929\u5185\u5BB9\u540E\u91CD\u65B0\u6821\u9A8C\u3002",
        TIMELINE_INVALID: "\u56DE\u5408\u8BB0\u5F55\u635F\u574F\uFF0C\u5DF2\u4FDD\u7559\u539F\u6863\u3002\u8BF7\u68C0\u67E5\u5907\u4EFD\u6216\u63D0\u4F9B\u8BCA\u65AD\u4FE1\u606F\u3002",
        SAVE_INVALID: "\u5B58\u6863\u6570\u636E\u635F\u574F\uFF0C\u5DF2\u4FDD\u7559\u539F\u6863\u3002\u8BF7\u68C0\u67E5\u5907\u4EFD\u3002",
        SAVE_VERSION_UNSUPPORTED: "\u6B64\u5B58\u6863\u7248\u672C\u6682\u4E0D\u652F\u6301\uFF0C\u8BF7\u4F7F\u7528\u5BF9\u5E94\u7248\u672C\u7684\u89D2\u8272\u5361\u3002",
        WRITE_CONFLICT: "\u5176\u4ED6\u811A\u672C\u5B9E\u4F8B\u4FEE\u6539\u4E86\u5B58\u6863\uFF0C\u672C\u6B21\u672A\u8986\u76D6\u3002\u8BF7\u5173\u95ED\u91CD\u590D\u5B9E\u4F8B\u540E\u91CD\u65B0\u6821\u9A8C\u3002",
        WRITE_FAILED: "\u5B58\u50A8\u5E94\u7B54\u5931\u8D25\uFF0C\u5185\u5B58\u64CD\u4F5C\u5DF2\u64A4\u56DE\u3002\u8BF7\u5148\u91CD\u65B0\u6821\u9A8C\u786E\u8BA4\u662F\u5426\u5DF2\u843D\u76D8\uFF0C\u518D\u91CD\u8BD5\u539F\u64CD\u4F5C\u3002",
        READ_FAILED: "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u5B58\u6863\uFF0C\u8BF7\u7A0D\u540E\u91CD\u65B0\u6821\u9A8C\u3002",
        HISTORY_CHANGED: "\u64CD\u4F5C\u671F\u95F4\u804A\u5929\u53D1\u751F\u53D8\u5316\uFF0C\u5185\u5B58\u64CD\u4F5C\u5DF2\u64A4\u56DE\u3002\u8BF7\u91CD\u65B0\u6821\u9A8C\u540E\u518D\u64CD\u4F5C\u3002",
        MESSAGE_NOT_FOUND: "\u5F53\u524D\u804A\u5929\u4E2D\u5C1A\u672A\u627E\u5230\u8FD9\u6761\u73A9\u5BB6\u6D88\u606F\uFF0C\u672C\u6B21\u672A\u7ED3\u7B97\u3002\u8BF7\u7B49\u5F85\u6D88\u606F\u52A0\u8F7D\u540E\u91CD\u8BD5\u3002",
        RECOVERY_CONFIRM_REQUIRED: "\u8BF7\u5148\u786E\u8BA4\u662F\u5426\u4EE5\u73B0\u5B58\u5B58\u6863\u7684\u8FDB\u5EA6\u4E3A\u51C6\u7EE7\u7EED\u3002",
        RECOVERY_EXPIRED: "\u804A\u5929\u5DF2\u7ECF\u5207\u6362\uFF0C\u8BF7\u5728\u5F53\u524D\u804A\u5929\u91CD\u65B0\u6821\u9A8C\u540E\u518D\u9009\u62E9\u6062\u590D\u3002",
        RECOVERY_UNAVAILABLE: "\u5BBF\u4E3B\u672A\u63D0\u4F9B\u5B8C\u6574\u804A\u5929\u8EAB\u4EFD\u548C\u5386\u53F2\uFF0C\u6682\u65F6\u65E0\u6CD5\u5EFA\u7ACB\u65B0\u68C0\u67E5\u70B9\u3002",
        BACKUP_MISSING: "\u6CA1\u6709\u53EF\u6062\u590D\u7684\u5907\u4EFD\u3002"
      };
      function syncReport(error = {}, context = {}) {
        var _a;
        const code = typeof error === "string" ? error : error.code || "SYNC_FAILED";
        const result = {
          code,
          message: MESSAGES[code] || "\u64CD\u4F5C\u672A\u5B8C\u6210\uFF0C\u8BF7\u4FDD\u7559\u5F53\u524D\u804A\u5929\u5E76\u91CD\u65B0\u6821\u9A8C\u3002"
        };
        const source = error.location || {};
        const epoch = context.sessionEpoch ?? error.sessionEpoch;
        if (Number.isInteger(epoch)) result.sessionEpoch = epoch;
        result.location = {};
        for (const key of [
          "index",
          "messageId",
          "kind",
          "checkpointIndex",
          "gameTurn"
        ])
          if (["string", "number"].includes(typeof source[key]))
            result.location[key] = source[key];
        if (Number.isInteger(context.gameTurn))
          (_a = result.location).gameTurn ?? (_a.gameTurn = context.gameTurn);
        return result;
      }
      module.exports = { syncReport };
    }
  });

  // src/host/chat-sync/controller.js
  var require_controller = __commonJS({
    "src/host/chat-sync/controller.js"(exports, module) {
      "use strict";
      var { VAR_SAVE, VAR_INIT, VAR_CONF, VAR_TIMELINE } = require_keys();
      var { createChatRepository } = require_repository();
      var { createSyncDiagnostics } = require_diagnostics();
      var { createSession } = require_session();
      var T = require_timeline();
      var { syncReport } = require_chat_sync_report();
      function createChatSync({
        state,
        vars,
        createGame,
        defaultInit,
        syncTargetWorldbook,
        applyTargetOpening,
        publishSnapshot = () => {
        },
        clearReceipt = () => {
        },
        readContext = async () => ({ scope: null, history: null }),
        now = Date.now
      }) {
        const repository = createChatRepository(vars);
        const diagnostics = createSyncDiagnostics({ now });
        let journal = null, revision = null, queue = Promise.resolve(), disposed = false, blocked = null, hasSaved = false, savedFingerprint, lastFailure = null, needsReload = false;
        const session = createSession(readContext, (context, initialized) => {
          if (initialized) {
            state.game = null;
            state.conf = { autoSettle: false };
            state.pending = null;
            state.raced = false;
            journal = null;
            revision = null;
            blocked = null;
            lastFailure = null;
            needsReload = false;
            hasSaved = false;
            savedFingerprint = void 0;
            clearReceipt();
          }
          diagnostics.record("session.active", {
            verified: context?.scope != null,
            history: Array.isArray(context?.history)
          });
        });
        const fail = (code, message) => Object.assign(new Error(message), { code });
        function exclusive(operation) {
          const ticket = session.capture();
          ticket.catch(() => {
          });
          const task = queue.then(async () => {
            if (disposed) throw fail("SYNC_DISPOSED", "\u540C\u6B65\u6A21\u5757\u5DF2\u5378\u8F7D");
            const token = await ticket;
            await session.check(token);
            try {
              return await operation(token);
            } catch (cause) {
              await session.check(token);
              if ([
                "HISTORY_OUTSIDE_WINDOW",
                "TIMELINE_INVALID",
                "SAVE_INVALID",
                "SAVE_VERSION_UNSUPPORTED",
                "WRITE_CONFLICT"
              ].includes(cause.code))
                blocked = cause.code;
              if (!["STALE_SESSION", "SYNC_DISPOSED"].includes(cause.code) && session.epoch === token.epoch) {
                cause.report = syncReport(cause, {
                  gameTurn: state.game?._g?.floor,
                  sessionEpoch: token.epoch
                });
                lastFailure = cause.report;
                diagnostics.record("operation.failed", cause.report);
              }
              throw cause;
            }
          });
          queue = task.catch(() => {
          });
          return task;
        }
        async function readVariables(token) {
          diagnostics.record("read.start");
          await session.check(token);
          let value;
          try {
            value = await repository.read() || {};
          } catch (cause) {
            throw diagnostics.failure("read.failed", "READ_FAILED", cause);
          }
          await session.check(token);
          diagnostics.record("read.done");
          return value;
        }
        function syncConf(variables) {
          if (variables[VAR_CONF])
            state.conf = { ...state.conf, ...variables[VAR_CONF] };
        }
        function restore(save) {
          return createGame({ saved: T.clone(save) });
        }
        async function load(token, { force = false, beforeUser } = {}) {
          force = force || needsReload;
          if (blocked && !force)
            throw Object.assign(
              fail(blocked, "\u5B58\u6863\u5C1A\u672A\u5B8C\u6210\u6821\u9A8C\uFF0C\u8BF7\u6062\u590D\u5BF9\u5E94\u804A\u5929\u6216\u91CD\u65B0\u8BFB\u53D6"),
              { location: lastFailure?.location }
            );
          if (state.game && !force) return state.game;
          const variables = await readVariables(token);
          syncConf(variables);
          diagnostics.record("restore.start");
          let game;
          try {
            const saved = variables[VAR_SAVE];
            savedFingerprint = T.fingerprint(saved ?? null);
            hasSaved = saved != null;
            if (saved != null) {
              if (![1, 2].includes(saved.v))
                throw fail("SAVE_VERSION_UNSUPPORTED", "\u5B58\u6863\u7248\u672C\u4E0D\u652F\u6301\uFF0C\u539F\u6863\u5DF2\u4FDD\u7559");
              game = restore(saved);
            } else
              game = createGame(
                Object.assign(
                  defaultInit(variables[VAR_INIT]),
                  variables[VAR_INIT] || {}
                )
              );
            journal = variables[VAR_TIMELINE] == null ? null : T.validateTimeline(variables[VAR_TIMELINE]);
            revision = journal?.revision ?? null;
            if (token.scope && Array.isArray(token.context.history)) {
              if (!journal)
                journal = T.newTimeline(
                  game.save(),
                  token.context.history,
                  token.scope,
                  beforeUser
                );
              const current = await session.check(token);
              const found = T.locate(journal, current.history);
              game = restore(found.save);
            }
          } catch (cause) {
            state.game = null;
            journal = null;
            if (cause.code) throw cause;
            throw diagnostics.failure("restore.failed", "RESTORE_FAILED", cause);
          }
          await session.check(token);
          state.game = game;
          needsReload = false;
          blocked = null;
          diagnostics.record("restore.done", { floor: game.save().floor });
          const targetId = game._g?.targetId || variables[VAR_INIT]?.targetId || "college";
          Promise.resolve(syncTargetWorldbook(targetId, () => session.check(token))).then(async (result) => {
            try {
              await session.check(token);
              state.wb = result;
            } catch {
            }
          }).catch(() => {
          });
          return game;
        }
        function displaySnapshot(token) {
          const snap = state.game.snapshot();
          if (snap.dayPlan)
            snap.dayPlan.sync = {
              scope: T.fingerprint(token.scope ?? null),
              epoch: token.epoch
            };
          return snap;
        }
        async function persist(token, { reason = "save", init, expectedPath } = {}) {
          if (blocked) throw fail(blocked, "\u65F6\u95F4\u7EBF\u6821\u9A8C\u672A\u5B8C\u6210\uFF0C\u5DF2\u963B\u6B62\u8986\u76D6\u5B58\u6863");
          diagnostics.record("persist.prepare");
          let snap, save;
          try {
            snap = displaySnapshot(token);
            save = state.game.save();
          } catch (cause) {
            throw diagnostics.failure(
              "persist.prepare.failed",
              "SERIALIZE_FAILED",
              cause
            );
          }
          const previous = await readVariables(token);
          if ((previous[VAR_TIMELINE]?.revision ?? null) !== revision)
            throw fail(
              "WRITE_CONFLICT",
              "\u5B58\u6863\u5DF2\u88AB\u5176\u4ED6\u5B9E\u4F8B\u4FEE\u6539\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6\uFF1B\u672C\u6B21\u672A\u8986\u76D6"
            );
          if (savedFingerprint !== void 0 && T.fingerprint(previous[VAR_SAVE] ?? null) !== savedFingerprint)
            throw fail("WRITE_CONFLICT", "\u5B58\u6863\u6B63\u6587\u88AB\u5176\u4ED6\u811A\u672C\u4FEE\u6539\uFF1B\u672C\u6B21\u672A\u8986\u76D6");
          const nextJournal = T.clone(journal);
          if (nextJournal) {
            nextJournal.revision = (revision ?? 0) + 1;
            nextJournal.owner = token.scope;
          }
          const hostDiagnostics = {
            inject: state.injectMode || "unknown",
            verified: state.injectVerified ?? null,
            wb: state.wb ? {
              ok: !!state.wb.ok,
              skipped: !!state.wb.skipped,
              reason: state.wb.reason || state.wb.error || null,
              name: state.wb.name || null,
              active: state.wb.activeName || null
            } : null,
            opening: state.opening || null,
            floor: save.floor,
            at: now(),
            sync: {
              scopeVerified: !!token.scope,
              timeline: !!nextJournal,
              revision: nextJournal?.revision ?? null,
              scope: token.scope,
              reason
            }
          };
          const current = await session.check(token);
          if (expectedPath && T.fingerprint(T.tokens(current.history || [])) !== T.fingerprint(expectedPath))
            throw fail("HISTORY_CHANGED", "\u64CD\u4F5C\u671F\u95F4\u804A\u5929\u53D1\u751F\u53D8\u5316\uFF0C\u672C\u6B21\u672A\u4FDD\u5B58");
          diagnostics.record("persist.write", { floor: save.floor });
          needsReload = true;
          try {
            await repository.writeSnapshot({
              save,
              snap,
              diagnostics: hostDiagnostics,
              timeline: nextJournal,
              backup: previous[VAR_SAVE] ? {
                save: previous[VAR_SAVE],
                timeline: previous[VAR_TIMELINE] || null,
                at: now(),
                reason
              } : void 0,
              init
            });
          } catch (cause) {
            throw diagnostics.failure("persist.failed", "WRITE_FAILED", cause);
          }
          const committedContext = await session.check(token);
          if (expectedPath && T.fingerprint(T.tokens(committedContext.history || [])) !== T.fingerprint(expectedPath))
            throw fail("HISTORY_CHANGED", "\u5B58\u50A8\u671F\u95F4\u804A\u5929\u53D1\u751F\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6821\u9A8C");
          needsReload = false;
          journal = nextJournal;
          revision = journal?.revision ?? null;
          hasSaved = true;
          savedFingerprint = T.fingerprint(save);
          lastFailure = null;
          diagnostics.record("persist.done", { floor: save.floor });
          try {
            await publishSnapshot(snap, {
              scope: token.scope,
              revision,
              syncOk: true
            });
          } catch {
            diagnostics.record("publish.failed", {
              code: "PUBLISH_FAILED",
              floor: save.floor
            });
          }
          return snap;
        }
        function draftRollback(game, timeline, token) {
          return (error) => {
            if (session.epoch === token.epoch) {
              state.game = game;
              journal = timeline;
            }
            throw error;
          };
        }
        async function reconcile(token) {
          await load(token, { force: !!blocked });
          const context = await session.check(token);
          if (!hasSaved && (!journal || journal.nodes.length === 0)) {
            lastFailure = null;
            await publishSnapshot(null, { scope: token.scope, syncOk: true });
            return null;
          }
          if (!journal || !Array.isArray(context.history)) {
            const snap = displaySnapshot(token);
            lastFailure = null;
            await publishSnapshot(snap, { scope: token.scope, syncOk: true });
            return snap;
          }
          const found = T.locate(journal, context.history);
          const old = state.game, oldJournal = T.clone(journal);
          state.game = restore(found.save);
          try {
            if (found.node) {
              const index = T.userIndex(
                context.history,
                context.history[found.node.path.length - 1]?.id
              );
              const reply2 = context.history.slice(index + 1).find((m) => m.role === "assistant");
              if (reply2 && (!found.node.replyPath || !T.prefix(found.node.replyPath, T.tokens(context.history)))) {
                const end = context.history.indexOf(reply2) + 1;
                if (!found.local || found.local.path.length < end)
                  state.game.processReply(reply2.text);
                found.node.replyPath = T.tokens(context.history.slice(0, end));
                found.node.after = state.game.save();
              }
            }
            if (T.fingerprint(old.save()) !== T.fingerprint(state.game.save()) || savedFingerprint !== T.fingerprint(state.game.save()) || T.fingerprint(oldJournal) !== T.fingerprint(journal) || journal.owner !== token.scope)
              return await persist(token, {
                reason: "history-recovery",
                expectedPath: T.tokens(context.history)
              });
            const snap = displaySnapshot(token);
            lastFailure = null;
            await publishSnapshot(snap, {
              scope: token.scope,
              revision,
              syncOk: true
            });
            return snap;
          } catch (error) {
            return draftRollback(old, oldJournal, token)(error);
          }
        }
        async function input(token, { messageId, text, actions = [] }) {
          await load(token, { beforeUser: messageId });
          const context = await session.check(token);
          if (journal && Array.isArray(context.history))
            state.game = restore(T.locate(journal, context.history).save);
          if (state.game._g?.dayPlan?.source === "daily" && state.game._g.dayPlan.activity?.kind !== "tailing") {
            clearReceipt();
            return {
              narrativeOnly: true,
              floor: state.game.save().floor,
              stats: displaySnapshot(token)
            };
          }
          const path = journal && Array.isArray(context.history) ? T.inputPath(context.history, messageId) : null;
          if (path && context.history[T.userIndex(context.history, messageId)]?.text !== text)
            throw fail("HISTORY_CHANGED", "\u8BFB\u53D6\u7684\u73A9\u5BB6\u6D88\u606F\u5DF2\u53D1\u751F\u53D8\u5316\uFF0C\u672C\u6B21\u672A\u7ED3\u7B97");
          const key = path && T.fingerprint(path);
          const existing = key && journal.nodes.find((n) => n.key === key);
          if (existing) {
            await reconcile(token);
            diagnostics.record("input.reused", { floor: existing.result.floor });
            return { ...T.clone(existing.result), reused: true };
          }
          const old = state.game, oldJournal = T.clone(journal);
          const before = journal ? T.locate(journal, context.history).save : old.save();
          state.game = restore(before);
          try {
            const result = state.game.settleInput(text, { actions });
            if (journal) {
              const after = state.game.save();
              journal.nodes.push({
                key,
                path,
                before: T.clone(before),
                afterInput: T.clone(after),
                after: T.clone(after),
                result: T.clone(result),
                replyPath: null
              });
              T.prune(journal, path);
            }
            result.stats = await persist(token, {
              reason: "input",
              expectedPath: Array.isArray(context.history) ? T.tokens(context.history) : void 0
            });
            return T.clone(result);
          } catch (error) {
            return draftRollback(old, oldJournal, token)(error);
          }
        }
        async function reply(token, { text, auto = false } = {}) {
          const context = await session.check(token);
          const index = T.userIndex(context.history);
          await load(token, {
            beforeUser: index >= 0 ? context.history[index].id : void 0
          });
          if (!text) return null;
          if (journal && Array.isArray(context.history))
            state.game = restore(T.locate(journal, context.history).save);
          if (state.game._g?.dayPlan?.source === "daily" && state.game._g.dayPlan.activity?.kind !== "tailing")
            return null;
          const old = state.game, oldJournal = T.clone(journal);
          try {
            let node = null;
            if (journal && index >= 0) {
              const path = T.inputPath(context.history, context.history[index].id), key = T.fingerprint(path);
              node = journal.nodes.find((n) => n.key === key);
              if (!node && !auto) return null;
              if (!node) {
                const before = T.locate(journal, context.history).save;
                state.game = restore(before);
                const result = state.game.processFloor(text);
                node = {
                  key,
                  path,
                  before,
                  afterInput: state.game.save(),
                  after: state.game.save(),
                  result: T.clone(result),
                  replyPath: null,
                  auto: true
                };
                journal.nodes.push(node);
                T.prune(journal, path);
              } else {
                const fullPath = T.tokens(context.history);
                if (node.replyPath && T.prefix(node.replyPath, fullPath)) {
                  await reconcile(token);
                  return T.clone(node.result);
                }
                const found = T.locate(journal, context.history);
                state.game = restore(found.save);
                if (!found.local || found.local.path.length <= index + 1)
                  state.game.processReply(text);
              }
              node.replyPath = T.tokens(context.history);
              node.after = state.game.save();
            } else {
              state.game = restore(old.save());
              if (auto) state.game.processFloor(text);
              else state.game.processReply(text);
            }
            return await persist(token, {
              reason: "reply",
              expectedPath: Array.isArray(context.history) ? T.tokens(context.history) : void 0
            });
          } catch (error) {
            return draftRollback(old, oldJournal, token)(error);
          }
        }
        async function newGame(token, init) {
          const previous = await readVariables(token), old = state.game, oldJournal = T.clone(journal);
          revision = previous[VAR_TIMELINE]?.revision ?? null;
          savedFingerprint = T.fingerprint(previous[VAR_SAVE] ?? null);
          try {
            state.game = createGame(Object.assign(defaultInit(init), init || {}));
            blocked = null;
            if (init?.targetId) {
              state.wb = await syncTargetWorldbook(
                init.targetId,
                () => session.check(token)
              );
              await session.check(token);
              state.opening = await applyTargetOpening(
                init.targetId,
                () => session.check(token)
              );
              await session.check(token);
            }
            const current = await session.check(token);
            journal = token.scope && Array.isArray(current.history) ? T.newTimeline(state.game.save(), current.history, token.scope) : null;
            state.pending = null;
            state.raced = false;
            clearReceipt();
            return await persist(token, { reason: "new-game", init });
          } catch (cause) {
            if (!cause.code)
              cause = diagnostics.failure("new.failed", "NEW_GAME_FAILED", cause);
            return draftRollback(old, oldJournal, token)(cause);
          }
        }
        function interrupt() {
          session.invalidate();
          state.pending = null;
          state.raced = false;
          clearReceipt();
        }
        return {
          rebuild: () => exclusive((token) => load(token, { force: true })),
          persist: () => exclusive(async (token) => {
            if (journal) await reconcile(token);
            const context = await session.check(token);
            return persist(token, {
              expectedPath: Array.isArray(context.history) ? T.tokens(context.history) : void 0
            });
          }),
          refreshConf: () => exclusive(async (token) => {
            const v = await readVariables(token);
            syncConf(v);
            return v;
          }),
          newGame: (init) => {
            interrupt();
            return exclusive((token) => newGame(token, init));
          },
          resetGame: () => {
            interrupt();
            return exclusive(async (token) => {
              const previous = await readVariables(token);
              await session.check(token);
              try {
                await repository.reset(
                  previous[VAR_SAVE] ? {
                    save: previous[VAR_SAVE],
                    timeline: previous[VAR_TIMELINE] || null,
                    at: now(),
                    reason: "reset"
                  } : null
                );
              } catch (cause) {
                throw diagnostics.failure("reset.failed", "RESET_FAILED", cause);
              }
              await session.check(token);
              state.game = null;
              journal = null;
              revision = null;
              blocked = null;
              diagnostics.record("reset.done");
              await publishSnapshot(null);
            });
          },
          setConf: (patch) => exclusive(async (token) => {
            const next = { ...state.conf, ...patch };
            if (typeof next.autoSettle !== "boolean" || next.injectPos != null && ![0, 1, 2].includes(next.injectPos) || next.injectDepth != null && (!Number.isInteger(next.injectDepth) || next.injectDepth < 0 || next.injectDepth > 100))
              throw fail("CONFIG_INVALID", "\u8BBE\u7F6E\u5B57\u6BB5\u65E0\u6548");
            await session.check(token);
            try {
              await repository.writeConf(next);
            } catch (cause) {
              throw diagnostics.failure(
                "config.failed",
                "CONFIG_WRITE_FAILED",
                cause
              );
            }
            await session.check(token);
            state.conf = next;
            return { ...next };
          }),
          runInput: (options) => exclusive((token) => input(token, options)),
          runReply: (options) => exclusive((token) => reply(token, options)),
          reconcile: () => exclusive(reconcile),
          mutate: (method, ...args) => exclusive(async (token) => {
            await reconcile(token);
            const commandContext = await session.check(token);
            const old = state.game, oldJournal = T.clone(journal);
            state.game = restore(old.save());
            const allowed = [
              "addItem",
              "removeItem",
              "equipItem",
              "unequipItem",
              "useItem",
              "nightFall",
              "executeDailyCommand"
            ];
            if (!allowed.includes(method))
              throw fail("COMMAND_INVALID", "\u4E0D\u652F\u6301\u7684\u6E38\u620F\u64CD\u4F5C");
            try {
              if (method === "executeDailyCommand") {
                const guard = args[0]?.sync;
                if (!guard || guard.scope !== T.fingerprint(token.scope ?? null) || guard.epoch !== token.epoch)
                  throw fail("DAY_STALE", "\u804A\u5929\u5DF2\u5207\u6362\uFF0C\u8BF7\u6309\u5F53\u524D\u65E5\u7A0B\u91CD\u65B0\u9009\u62E9");
                if (state.pending || state.generating || commandContext.history?.at(-1)?.role === "user")
                  throw fail("DAY_BUSY", "\u8BF7\u7B49\u5F85\u5F53\u524D\u56DE\u590D\u5B8C\u6210\u540E\u518D\u5B89\u6392\u6D3B\u52A8");
              }
              const result = state.game[method](...args);
              if (method === "executeDailyCommand" && result.reused) return result;
              if (journal) {
                const context = await session.check(token);
                if (!Array.isArray(context.history))
                  throw fail(
                    "HISTORY_UNAVAILABLE",
                    "\u5BBF\u4E3B\u6682\u672A\u63D0\u4F9B\u5B8C\u6574\u804A\u5929\u5386\u53F2\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5"
                  );
                T.checkpoint(journal, context.history, state.game.save());
              }
              await persist(token, {
                reason: "command",
                expectedPath: Array.isArray(commandContext.history) ? T.tokens(commandContext.history) : void 0
              });
              return result;
            } catch (error) {
              return draftRollback(old, oldJournal, token)(error);
            }
          }),
          acceptCurrentSave: ({ confirm = false, expectedEpoch } = {}) => exclusive(async (token) => {
            if (!confirm)
              throw fail("RECOVERY_CONFIRM_REQUIRED", "\u987B\u786E\u8BA4\u4EE5\u73B0\u5B58\u5B58\u6863\u4E3A\u51C6\u7EE7\u7EED");
            if (expectedEpoch != null && expectedEpoch !== token.epoch)
              throw fail("RECOVERY_EXPIRED", "\u6062\u590D\u64CD\u4F5C\u6240\u5C5E\u804A\u5929\u5DF2\u7ECF\u5207\u6362");
            const variables = await readVariables(token);
            const saved = variables[VAR_SAVE];
            if (!saved) throw fail("SAVE_INVALID", "\u6CA1\u6709\u53EF\u7528\u4E8E\u7EE7\u7EED\u7684\u5B8C\u6574\u5B58\u6863");
            if (![1, 2].includes(saved.v))
              throw fail("SAVE_VERSION_UNSUPPORTED", "\u5B58\u6863\u7248\u672C\u4E0D\u652F\u6301");
            const candidate = restore(saved);
            const context = await session.check(token);
            if (!token.scope || !Array.isArray(context.history))
              throw fail(
                "RECOVERY_UNAVAILABLE",
                "\u5BBF\u4E3B\u672A\u63D0\u4F9B\u5B8C\u6574\u804A\u5929\u8EAB\u4EFD\u548C\u5386\u53F2\uFF0C\u4E0D\u80FD\u91CD\u5EFA\u68C0\u67E5\u70B9"
              );
            const old = state.game, oldJournal = T.clone(journal);
            state.game = candidate;
            journal = T.newTimeline(candidate.save(), context.history, token.scope);
            revision = variables[VAR_TIMELINE]?.revision ?? null;
            savedFingerprint = T.fingerprint(saved);
            blocked = null;
            try {
              const snap = await persist(token, {
                reason: "accept-current-save",
                expectedPath: T.tokens(context.history)
              });
              state.pending = null;
              state.raced = false;
              clearReceipt();
              return snap;
            } catch (error) {
              return draftRollback(old, oldJournal, token)(error);
            }
          }),
          restoreBackup: () => exclusive(async (token) => {
            const variables = await readVariables(token), backup = variables.wx_sync_backup;
            if (!backup?.save) throw fail("BACKUP_MISSING", "\u6CA1\u6709\u53EF\u6062\u590D\u7684\u5907\u4EFD");
            let candidate = restore(backup.save);
            const restoredJournal = backup.timeline ? T.validateTimeline(backup.timeline) : null;
            const context = await session.check(token);
            if (restoredJournal && Array.isArray(context.history))
              candidate = restore(T.locate(restoredJournal, context.history).save);
            const old = state.game, oldJournal = T.clone(journal);
            state.game = candidate;
            journal = restoredJournal;
            revision = variables[VAR_TIMELINE]?.revision ?? null;
            savedFingerprint = T.fingerprint(variables[VAR_SAVE] ?? null);
            blocked = null;
            try {
              return await persist(token, {
                reason: "backup-recovery",
                expectedPath: Array.isArray(context.history) ? T.tokens(context.history) : void 0
              });
            } catch (error) {
              return draftRollback(old, oldJournal, token)(error);
            }
          }),
          getCurrentResult: () => exclusive(async (token) => {
            await load(token);
            const context = await session.check(token);
            if (state.game._g?.dayPlan?.source === "daily" && state.game._g.dayPlan.activity?.kind !== "tailing")
              return { narrativeOnly: true, stats: displaySnapshot(token) };
            if (!journal) return null;
            return T.clone(T.locate(journal, context.history).node?.result || null);
          }),
          interrupt,
          captureSession: session.capture,
          checkSession: session.check,
          dispose: () => {
            disposed = true;
            interrupt();
          },
          getSyncDiagnostics: () => ({
            ...diagnostics.snapshot(),
            capabilities: {
              scopeVerified: journal?.owner != null,
              timeline: !!journal
            },
            revision,
            blocked,
            needsReload,
            lastFailure: T.clone(lastFailure)
          })
        };
      }
      module.exports = { createChatSync };
    }
  });

  // src/host/glue.js
  var require_glue = __commonJS({
    "src/host/glue.js"(exports, module) {
      var {
        hostFrames,
        findTavernHelper,
        detectApi,
        extractLlmText,
        hostFn,
        hostCharacterData
      } = require_environment();
      var { defaultInit } = require_initial_state();
      var { receiptText } = require_receipt();
      var { dailyContextText } = require_daily_context();
      var { syncTargetWorldbook } = require_worldbook();
      var { applyTargetOpening } = require_opening();
      var { createGame } = require_game();
      var {
        VAR_SAVE,
        VAR_SNAP,
        VAR_INIT,
        VAR_CONF
      } = require_keys();
      var { createChatSync } = require_controller();
      async function startGlue() {
        const api = detectApi();
        if (!api.vars.has)
          return { ok: false, reason: "\u65E0\u9152\u9986\u53D8\u91CF API\uFF08\u975E\u9152\u9986\u52A9\u624B\u73AF\u5883\uFF09" };
        const g0 = typeof globalThis !== "undefined" ? globalThis : window;
        const nameReader = hostFn("getCurrentCharacterName");
        if (nameReader) {
          try {
            const name = String(await nameReader() || "");
            if (name && !name.includes("\u5C3E\u884C"))
              return { ok: false, reason: "\u975E\u5C3E\u884C\u5361\uFF08" + name + "\uFF09" };
          } catch (e) {
          }
        }
        const state = {
          game: null,
          conf: { autoSettle: false },
          pending: null,
          raced: false,
          injectMode: null,
          injectVerified: null
        };
        const sync = createChatSync({
          state,
          vars: api.vars,
          readContext: api.readContext,
          clearReceipt: () => {
            try {
              api.uninjectPrompts(["wx_receipt"]);
            } catch {
            }
          },
          createGame,
          defaultInit,
          syncTargetWorldbook,
          applyTargetOpening,
          publishSnapshot: (snap, metadata) => {
            if (typeof window !== "undefined") {
              const target = window.parent || window;
              target.postMessage(
                snap ? {
                  wxSnap: snap,
                  wxScope: metadata?.scope,
                  wxSyncOk: metadata?.syncOk
                } : {
                  wxReset: true,
                  wxScope: metadata?.scope,
                  wxSyncOk: metadata?.syncOk
                },
                "*"
              );
            }
          }
        });
        const { rebuild, persist, newGame, resetGame, setConf } = sync;
        await sync.refreshConf();
        async function handleFloor(llmText) {
          return sync.runReply({ text: String(llmText || ""), auto: true });
        }
        function notifySettlePanel(r) {
          let shown = false;
          try {
            const top = typeof window !== "undefined" && window.parent && window.parent !== window ? window.parent : typeof window !== "undefined" ? window : null;
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
          const token = await sync.captureSession();
          const pending = { messageId };
          state.pending = pending;
          try {
            console.log(
              "[M4] MESSAGE_SENT \u6536\u5230",
              messageId !== void 0 ? "\u697C" + messageId : ""
            );
            if (state.conf.autoSettle && !state.game) await sync.rebuild();
            if (state.conf.autoSettle && state.game?._g?.dayPlan?.source !== "daily") {
              console.log("[M4] \u81EA\u52A8\u63B7\u6A21\u5F0F\uFF0C\u8DF3\u8FC7\u62E6\u622A");
              return;
            }
            const msg = await api.readById(messageId);
            const text = extractLlmText(msg);
            if (msg?.role === "assistant" || msg?.is_user === false) return;
            if (!text || text.trimStart().startsWith("/")) {
              console.log("[M4] \u7A7A\u8F93\u5165/\u659C\u6760\u547D\u4EE4\uFF0C\u653E\u884C\u4E0D\u7ED3\u7B97");
              return;
            }
            await sync.checkSession(token);
            const topWin = typeof window !== "undefined" && window.parent && window.parent !== window ? window.parent : typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null;
            let pickedActions = null;
            if (topWin && topWin.WxStatusbar && typeof topWin.WxStatusbar.consumeActiveActions === "function") {
              try {
                pickedActions = topWin.WxStatusbar.consumeActiveActions();
              } catch (e) {
              }
            }
            const actSummary = pickedActions && pickedActions.length ? pickedActions.map((a) => `${a.id}(${a.name || a.id})`).join(", ") : "\u672A\u9009\u80F6\u56CA\uFF08\u7EAF\u53D9\u4E8B\uFF09";
            console.log(
              `[M4] \u52A8\u4F5C\u8F93\u5165\uFF1A[${actSummary}] \uFF5C \u4F34\u968F\u53D9\u4E8B\uFF1A${String(text).slice(0, 30)}`
            );
            const r = await sync.runInput({
              messageId,
              text,
              actions: pickedActions || []
            });
            await sync.checkSession(token);
            if (r.narrativeOnly) {
              await api.injectPrompts?.([
                {
                  id: "wx_receipt",
                  position: state.conf.injectPos ?? 1,
                  depth: state.conf.injectDepth ?? 1,
                  role: 0,
                  content: dailyContextText(r.stats)
                }
              ]);
              await sync.checkSession(token);
              return;
            }
            console.log(
              `[M4] \u7ED3\u7B97\u5B8C\u6210\uFF1A\u697C${r.floor} \xB7 \u52A8\u4F5C${r.package.actions.length}\u4E2A${r.package.narrativeOnly ? "\uFF08\u7EAF\u53D9\u4E8B\uFF09" : ""}`
            );
            let injectRes = null;
            if (api.injectPrompts) {
              try {
                api.uninjectPrompts(["wx_receipt"]);
              } catch (e) {
              }
              const pos = Number.isInteger(state.conf.injectPos) ? state.conf.injectPos : 1;
              const depth = Number.isInteger(state.conf.injectDepth) ? state.conf.injectDepth : 1;
              injectRes = await api.injectPrompts([
                {
                  id: "wx_receipt",
                  position: pos,
                  depth,
                  role: 0,
                  content: receiptText(r)
                }
              ]);
            }
            state.injectMode = injectRes ? injectRes.mode : "none";
            state.injectVerified = injectRes ? injectRes.verified : null;
            if (injectRes) {
              console.log(
                `[M4] \u56DE\u6267\u5DF2\u6CE8\u5165 \u2713\uFF08\u901A\u9053\uFF1A${injectRes.mode}\uFF09` + (injectRes.verified === null ? "" : injectRes.verified ? "\uFF0C\u56DE\u8BFB\u6821\u9A8C\u901A\u8FC7" : "\uFF0C\u56DE\u8BFB\u6821\u9A8C\u4E0D\u7B26")
              );
            } else {
              console.warn(
                "[M4] \u56DE\u6267\u6CE8\u5165\u5931\u8D25\uFF1ATavernHelper.injectPrompts \u4E0E SillyTavern.setExtensionPrompt \u90FD\u4E0D\u53EF\u7528\u2014\u2014\u6A21\u578B\u5C06\u770B\u4E0D\u5230\u4E2D\u63A7\u771F\u503C"
              );
            }
            await sync.checkSession(token);
            await persist();
            await sync.checkSession(token);
            if (!r.reused) notifySettlePanel(r);
            console.log("[M4] \u9762\u677F\u901A\u77E5\u5DF2\u53D1 \u2713");
            if (state.raced && api.stopAllGeneration && api.generate) {
              state.raced = false;
              try {
                api.stopAllGeneration();
              } catch (e) {
              }
              try {
                await api.generate({});
              } catch (e) {
              }
            }
          } catch (e) {
            console.warn("[M4] \u62E6\u622A\u7ED3\u7B97\u5931\u8D25\uFF1A", e && (e.stack || e.message || e));
            if (!["STALE_SESSION", "SYNC_DISPOSED"].includes(e.code)) reportError(e);
          } finally {
            if (state.pending === pending) state.pending = null;
          }
        }
        let generationSession = null;
        function reportError(error) {
          const top = typeof window !== "undefined" ? window.parent || window : null;
          if (["STALE_SESSION", "SYNC_DISPOSED"].includes(error.code)) return;
          const report = error.report || {
            code: error.code || "SYNC_FAILED",
            location: error.location
          };
          if (top?.WxStatusbar?.reportSyncError)
            top.WxStatusbar.reportSyncError(report);
          else top?.postMessage({ wxSyncError: report }, "*");
        }
        async function onReplyEnded() {
          state.generating = false;
          const ticket = generationSession;
          try {
            if (ticket) await sync.checkSession(await ticket);
            await sync.refreshConf();
            const msg = api.readLast ? await api.readLast() : null;
            if (msg?.role === "user" || msg?.is_user === true) return;
            const text = extractLlmText(msg);
            if (ticket) await sync.checkSession(await ticket);
            await sync.runReply({ text, auto: state.conf.autoSettle });
          } catch (error) {
            console.warn("[CHAT_SYNC:REPLY_FAILED]", error);
            if (error.code !== "STALE_SESSION") reportError(error);
          }
        }
        async function refreshHistory() {
          try {
            const token = await sync.captureSession();
            await sync.reconcile();
            const result = await sync.getCurrentResult();
            await sync.checkSession(token);
            if (result?.package || result?.narrativeOnly)
              await api.injectPrompts([
                {
                  id: "wx_receipt",
                  position: 1,
                  depth: 1,
                  role: 0,
                  content: result.narrativeOnly ? dailyContextText(result.stats) : receiptText(result)
                }
              ]);
            else api.uninjectPrompts(["wx_receipt"]);
          } catch (error) {
            console.warn("[CHAT_SYNC:RECOVERY_FAILED]", error);
            if (!["STALE_SESSION", "SYNC_DISPOSED"].includes(error.code))
              reportError(error);
          }
        }
        g0.WxGlue?.dispose?.();
        api.onEvent("MESSAGE_SENT", (messageId) => {
          onUserSent(messageId).catch((error) => reportError(error));
        });
        api.onEvent("GENERATION_STARTED", () => {
          state.generating = true;
          generationSession = sync.captureSession();
          if (state.pending) state.raced = true;
        });
        api.onEvent("GENERATION_ENDED", onReplyEnded);
        api.onEvent("CHAT_CHANGED", () => {
          generationSession = null;
          state.generating = false;
          sync.interrupt();
          try {
            api.stopAllGeneration?.();
          } catch {
          }
          refreshHistory();
        });
        for (const name of ["MESSAGE_DELETED", "MESSAGE_UPDATED", "MESSAGE_SWIPED"])
          api.onEvent(name, refreshHistory);
        if (typeof globalThis !== "undefined") {
          globalThis.WxGlue = {
            handleFloor,
            rebuild,
            persist,
            newGame,
            resetGame,
            setConf,
            command: sync.mutate,
            reconcile: sync.reconcile,
            restoreBackup: sync.restoreBackup,
            acceptCurrentSave: sync.acceptCurrentSave,
            dispose: () => {
              api.dispose();
              sync.dispose();
            },
            getSyncDiagnostics: sync.getSyncDiagnostics,
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
      module.exports = {
        startGlue,
        syncTargetWorldbook,
        applyTargetOpening,
        receiptText,
        VAR_SAVE,
        VAR_SNAP,
        VAR_INIT,
        VAR_CONF
      };
    }
  });

  // package.json
  var require_package = __commonJS({
    "package.json"(exports, module) {
      module.exports = {
        name: "weixing-engine",
        version: "0.8.7",
        private: true,
        description: "\u5C3E\u884C \xB7 \u6570\u503C\u5F15\u64CE\u4E0E\u9152\u9986\u89D2\u8272\u5361\uFF08\u68C0\u5B9A/\u5FC3\u8DF3/\u8B66\u89C9/\u51B2\u7A81/\u8FFD\u9010/HUD\uFF09",
        scripts: {
          test: "node tools/test.cjs",
          build: "node build.js",
          "build:runtime": "node build-runtime.js",
          "build:ui": "node tools/build/ui.js",
          "format:modules": 'prettier --write "src/runtime/game/**/*.js" "src/host/**/*.js" "src/ui/**/*.js" build*.js "tools/build/*.js" tools/test.cjs',
          "test:sync": "node tools/test.cjs chat-sync.test.js timeline.test.js day-plan.test.js daily-actions.test.js economy.test.js sync-notice.test.js m4.test.js inject.test.js target-default.test.js",
          typecheck: "tsc -p tsconfig.contracts.json",
          "test:browser": "node tools/check-browser.cjs",
          "preview:daily": "node tools/build/day-preview.js"
        },
        devDependencies: {
          "@types/node": "24.10.0",
          acorn: "8.15.0",
          esbuild: "0.25.12",
          jsdom: "26.1.0",
          prettier: "3.6.2",
          typescript: "5.9.3"
        }
      };
    }
  });

  // src/host/bootstrap.js
  var require_bootstrap = __commonJS({
    "src/host/bootstrap.js"(exports, module) {
      var { createGame } = require_game();
      var facts = require_facts2();
      var map = require_map();
      var { loadLexicon } = require_lexicon2();
      var { startGlue } = require_glue();
      var LP = require_lifepack();
      var gluePromise = startGlue().catch((error) => {
        console.error("[CHAT_SYNC:START_FAILED]", error);
        return { ok: false, reason: error.code || error.message };
      });
      var api = {
        createGame,
        facts,
        map,
        loadLexicon,
        lifepack: LP,
        glue: gluePromise,
        version: require_package().version
      };
      if (typeof window !== "undefined") window.WxEngine = api;
      if (typeof globalThis !== "undefined") globalThis.WxEngine = api;
      if (typeof module !== "undefined") module.exports = api;
    }
  });
  require_bootstrap();
})();
