const buttonTest = document.getElementById('test');

//// Data to use in tests:

const tests = [
	{
		Input: {
			"Lemma": "ā",
			"PartOfSpeech": "Noun",
			"Meanings": "letter Aa",
			"indeclinable": true,
		},
		Expected: {
			"unencliticized": ["ā"],
			"ne": ["āne"],
			"que": ["āque"],
			"ve": ["āve"],
		}
	},
	{
		Input: {
			"Lemma": "ab",
			"PartOfSpeech": "Preposition",
			"Meanings": "from; by; since",
			"Forms": {
				"unencliticized": ["ā", "ab", "abs"],
				"ne": ["āne"],
				"que": ["āque"],
				"ve": ["āve"],
			},
		},
		Expected: {
			"unencliticized": ["ā", "ab", "abs"],
			"ne": ["āne"],
			"que": ["āque"],
			"ve": ["āve"],
		},
	},
	{
		Input: {
			"Lemma": "abarceō",
			"PartOfSpeech": "Verb",
			"Meanings": "keep away",
			"Conjugation": 2,
		},
		Expected: {},
	},
	{
		Input: {
			"Lemma": "abavia",
			"PartOfSpeech": "Noun",
			"Meanings": "great-great-grandmother",
			"Declension": 1,
		},
		Expected: {},
	},
	{
		Input: {
			"Lemma": "abavus",
			"PartOfSpeech": "Noun",
			"Meanings": "great-great-grandfather",
			"Declension": 2,
		},
		Expected: {},
	},
	{
		Input: {
			"Lemma": "abdicō",
			"PartOfSpeech": "Verb",
			"Meanings": "deny; abdicate; renounce",
			"Conjugation": 1,
		},
		Expected: {},
	},
	{
		Input: {
			"Lemma": "abdīcō",
			"PartOfSpeech": "Verb",
			"Meanings": "deny (an omen or right)",
			"Conjugation": 3,
		},
		Expected: {},
	},
	{
		Input: {
			"Lemma": "ac",
			"PartOfSpeech": "Conjunction",
			"Meanings": "and; compared to",
			"Forms": ["ac", "atque"],
		},
		Expected: ["ac", "atque"],
	}
];

//// Tests looping over the above arrays:

const test = () => {
	tests.forEach(({Input, Expected}) => {
		const actual = inflectFuncs[Input.PartOfSpeech](Input);

		const actualStringified = JSON.stringify(actual);
		const expectedStringified = JSON.stringify(Expected);

		const actualFormsSet = convertParsingObjectToFormsSet(actual);
		const expectedFormsSet = convertParsingObjectToFormsSet(Expected);

		console.log({actualFormsSet, expectedFormsSet});

		if (Object.keys(Expected) === 0) {
			console.log(`Expected forms have not been defined for this test; ${Input.Lemma}) => ${actual}`);
		}
		else if (actualStringified === '{}') {
			console.log(`Inflection function has not been defined for ${Input.PartOfSpeech}.`);
		}
		else if (actualStringified === expectedStringified) {
			console.log(`Yay! ${Input.Lemma} => ${actualStringified}`);
		}
		else if (isEqualSet(expectedFormsSet, actualFormsSet)) {
			console.error({
				message: 'Set of forms is correct but Json is different',
				Input,
				Expected,
				actual,
			});
		}
		else if (isSuperset(expectedFormsSet, actualFormsSet)) {
			console.error({
				message: 'Forms are missing',
				Input,
				expectedFormsSet,
				actualFormsSet,
			});
		}
		else {
			console.error({
				Input, Expected, Actual: actual
			});
		}
	})
}

//// Event-listener:

buttonTest.addEventListener('click', ()=>{
	test();
});
