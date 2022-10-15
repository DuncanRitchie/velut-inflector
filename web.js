//// DOM elements

const buttonClearInputs = document.getElementById('clear-inputs');
const buttonLoadSampleData = document.getElementById('load-sample-data');
const textareaInput = document.getElementById('textarea-input');
const textByGenerateJson = document.getElementById('text-by-generate-json');
const buttonGenerateJson = document.getElementById('generate-json');
const textareaOutput = document.getElementById('textarea-output');
const textByCopyToClipboard = document.getElementById('text-by-copy-to-clipboard');
const buttonCopyToClipboard = document.getElementById('copy-to-clipboard');
const buttonDownload = document.getElementById('download');

textareaOutput.value = '';


//// Sample data the user can load if they don’t have my Excel file:

const sampleDataJson =
[
	{
		"Lemma": "ā",
		"PartOfSpeech": "Noun",
		"Meanings": "letter Aa"
	},
	{
		"Lemma": "ab",
		"PartOfSpeech": "Preposition",
		"Meanings": "from; by; since"
	},
	{
		"Lemma": "abarceō",
		"PartOfSpeech": "Verb",
		"Meanings": "keep away"
	},
	{
		"Lemma": "abavia",
		"PartOfSpeech": "Noun",
		"Meanings": "great-great-grandmother"
	},
	{
		"Lemma": "abavus",
		"PartOfSpeech": "Noun",
		"Meanings": "great-great-grandfather"
	},
	{
		"Lemma": "abdicō",
		"PartOfSpeech": "Verb",
		"Meanings": "deny; abdicate; renounce"
	},
	{
		"Lemma": "abdīcō",
		"PartOfSpeech": "Verb",
		"Meanings": "deny (an omen or right)"
	},
	{
		"Lemma": "atque",
		"PartOfSpeech": "Conjunction",
		"Meanings": "and; compared to",
		"Forms": ["ac", "atque"]
	},
	{
		"Lemma": "ex",
		"PartOfSpeech": "Preposition",
		"Meanings": "out of",
		"Forms": ["ē"]
	},
	{
		"Lemma": "inter",
		"PartOfSpeech": "Preposition",
		"Meanings": "between; among; ‘interior’ = farther inside; ‘intimus’ = farthest inside",
		"Forms": {
			"positive": ["inter"],
			"comparative": {
				"masculine": {
					"singular": {
						"nominative": ["interior"],
						"vocative": ["interior"],
						"accusative": ["interiōrem"],
						"genitive": ["interiōris"],
						"dative": ["interiōrī"],
						"ablative": ["interiōre"]
					},
					"plural": {
						"nominative": ["interiōrēs"],
						"vocative": ["interiōrēs"],
						"accusative": ["interiōrēs"],
						"genitive": ["interiōrum"],
						"dative": ["interiōribus"],
						"ablative": ["interiōribus"]
					}
				},
				"feminine": {
					"singular": {
						"nominative": ["interior"],
						"vocative": ["interior"],
						"accusative": ["interiōrem"],
						"genitive": ["interiōris"],
						"dative": ["interiōrī"],
						"ablative": ["interiōre"]
					},
					"plural": {
						"nominative": ["interiōrēs"],
						"vocative": ["interiōrēs"],
						"accusative": ["interiōrēs"],
						"genitive": ["interiōrum"],
						"dative": ["interiōribus"],
						"ablative": ["interiōribus"]
					}
				},
				"neuter": {
					"singular": {
						"nominative": ["interius"],
						"vocative": ["interius"],
						"accusative": ["interius"],
						"genitive": ["interiōris"],
						"dative": ["interiōrī"],
						"ablative": ["interiōre"]
					},
					"plural": {
						"nominative": ["interiōra"],
						"vocative": ["interiōra"],
						"accusative": ["interiōra"],
						"genitive": ["interiōrum"],
						"dative": ["interiōribus"],
						"ablative": ["interiōribus"]
					}
				}
			}
		},
	"superlative": {
		"masculine": {
			"singular": {
				"nominative": ["intimus"],
				"vocative": ["intime"],
				"accusative": ["intimum"],
				"genitive": ["intimī"],
				"dative": ["intimō"],
				"ablative": ["intimō"]
			},
			"plural": {
				"nominative": ["intimī"],
				"vocative": ["intimī"],
				"accusative": ["intimōs"],
				"genitive": ["intimōrum"],
				"dative": ["intimīs"],
				"ablative": ["intimīs"]
			}
		},
		"feminine": {
			"singular": {
				"nominative": ["intima"],
				"vocative": ["intima"],
				"accusative": ["intimam"],
				"genitive": ["intimae"],
				"dative": ["intimae"],
				"ablative": ["intimā"]
			},
			"plural": {
				"nominative": ["intimae"],
				"vocative": ["intimae"],
				"accusative": ["intimās"],
				"genitive": ["intimārum"],
				"dative": ["intimīs"],
				"ablative": ["intimīs"]
			}
		},
		"neuter": {
			"singular": {
				"nominative": ["intimum"],
				"vocative": ["intimum"],
				"accusative": ["intimum"],
				"genitive": ["intimī"],
				"dative": ["intimō"],
				"ablative": ["intimō"]
			},
			"plural": {
				"nominative": ["intima"],
				"vocative": ["intima"],
				"accusative": ["intima"],
				"genitive": ["intimōrum"],
				"dative": ["intimīs"],
				"ablative": ["intimīs"]
			}
		}
	}
}
]
const sampleData = JSON.stringify(sampleDataJson, null, '\t');


//// Functions used in `generateJson`:

const clearTextMessages = () => {
	textByGenerateJson.textContent = '';
	textByCopyToClipboard.textContent = '';
}

const clearInputs = () => {
	textareaInput.value = '';
	textareaOutput.value = '';
	clearTextMessages();
}

const warnOfEmptyInput = () => {
	clearTextMessages();
	textByGenerateJson.textContent = 'Nothing to generate Json from!';
}

const warnOfEmptyOutput = () => {
	clearTextMessages();
	textByCopyToClipboard.textContent = 'Nothing to copy or download!';
}


//// Functions called by buttons:

const generateJson = () => {
	clearTextMessages();
	clearOutputObject();
	textByGenerateJson.textContent = 'Generating Json, please wait...';
	const allInputRows = JSON.parse(textareaInput.value);

	convertInputToOutputData(allInputRows);

	displayOutput();
	textByGenerateJson.textContent = 'Json generated!';
}

const displayOutput = () => {
	textareaOutput.value = JSON.stringify(outputAsObject, null, '\t');
}

const copyToClipboard = () => {
	clearTextMessages();
	textByCopyToClipboard.textContent = 'Copying to clipboard...';
	textareaOutput.select();
	document.execCommand('copy');
	textByCopyToClipboard.textContent = 'Copied!';
}

const download = () => {
	let a = document.createElement('a');
	a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textareaOutput.value.replace(/\n/g, '\r\n')));;
	a.setAttribute('download', 'words-from-collator_mongo.json');
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	clearTextMessages();
}


//// Event listeners.

buttonClearInputs.addEventListener('click', ()=>{
	clearInputs();
});

buttonLoadSampleData.addEventListener('click', ()=>{
	textareaInput.value = sampleData;
	clearTextMessages();
});

buttonGenerateJson.addEventListener('click', ()=>{
	if (textareaInput.value === '') {
		warnOfEmptyInput();
	}
	else {
		generateJson();
	}
});

buttonCopyToClipboard.addEventListener('click', ()=>{
	if (textareaOutput.value === '') {
		warnOfEmptyOutput();
	}
	else {
		copyToClipboard();
	}
});

buttonDownload.addEventListener('click', ()=>{
	if (textareaOutput.value === '') {
		warnOfEmptyOutput();
	}
	else {
		download();
	}
});
