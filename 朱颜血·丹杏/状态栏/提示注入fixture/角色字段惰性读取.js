// gpt：上游原样函数/枚举，仅移除ESM导出，来源与行号见元数据.json。
function createLazyFields(resolvers) {
    const result = /** @type {CharacterCardFields} */ ({});
    for (const [key, resolver] of Object.entries(resolvers)) {
        let cached;
        let resolved = false;
        Object.defineProperty(result, key, {
            get() {
                if (!resolved) {
                    cached = resolver();
                    resolved = true;
                }
                return cached;
            },
            enumerable: true,
            configurable: true,
        });
    }
    return result;
}

function getCharacterCardFieldsLazy({ chid = undefined } = {}) {
    const currentChid = chid ?? this_chid;
    const character = characters[currentChid];

    // For group chats, we need to check if group cards should be used
    const useGroupCards = selected_group && character;
    const groupCardsLazy = useGroupCards ? getGroupCharacterCardsLazy(selected_group, Number(currentChid)) : null;

    /** @type {Record<string, () => string|string[]>} */
    const resolvers = {
        persona: () => baseChatReplace(power_user.persona_description?.trim()),
        system: () => {
            if (!character) return '';
            const systemPrompt = chat_metadata.system_prompt || character.data?.system_prompt || '';
            return power_user.prefer_character_prompt ? baseChatReplace(systemPrompt.trim()) : '';
        },
        jailbreak: () => {
            if (!character) return '';
            return power_user.prefer_character_jailbreak ? baseChatReplace(character.data?.post_history_instructions?.trim()) : '';
        },
        version: () => character?.data?.character_version ?? '',
        charDepthPrompt: () => {
            if (!character) return '';
            return baseChatReplace(character.data?.extensions?.depth_prompt?.prompt?.trim());
        },
        creatorNotes: () => {
            if (!character) return '';
            return baseChatReplace(character.data?.creator_notes?.trim());
        },
        // These four fields may be overridden by group cards
        description: () => {
            if (groupCardsLazy) return groupCardsLazy.description;
            if (!character) return '';
            return baseChatReplace(character.description?.trim());
        },
        personality: () => {
            if (groupCardsLazy) return groupCardsLazy.personality;
            if (!character) return '';
            return baseChatReplace(character.personality?.trim());
        },
        scenario: () => {
            if (groupCardsLazy) return groupCardsLazy.scenario;
            if (!character) return '';
            const scenarioText = chat_metadata.scenario || character.scenario || '';
            return baseChatReplace(scenarioText.trim());
        },
        mesExamples: () => {
            if (groupCardsLazy) return groupCardsLazy.mesExamples;
            if (!character) return '';
            const exampleDialog = chat_metadata.mes_example || character.mes_example || '';
            return baseChatReplace(exampleDialog.trim());
        },
        firstMessage: () => {
            if (!character) return '';
            const firstMes = character.first_mes?.trim() || '';
            return baseChatReplace(firstMes);
        },
        alternateGreetings: () => {
            if (!character) return [];
            const altGreetings = character.data?.alternate_greetings;
            if (!Array.isArray(altGreetings)) return [];
            return altGreetings.map(greeting => baseChatReplace(greeting?.trim()));
        },
    };

    return createLazyFields(resolvers);
}

const extension_prompt_types = {
    NONE: -1,
    IN_PROMPT: 0,
    IN_CHAT: 1,
    BEFORE_PROMPT: 2,
};

const extension_prompt_roles = {
    SYSTEM: 0,
    USER: 1,
    ASSISTANT: 2,
};

const depth_prompt_depth_default = 4;

const depth_prompt_role_default = 'system';
