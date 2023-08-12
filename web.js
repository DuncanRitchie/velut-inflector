//// DOM elements

const buttonClearInputs = document.getElementById('clear-inputs');
const buttonLoadSampleData = document.getElementById('load-sample-data');
const textareaInput = document.getElementById('textarea-input');
const textByGenerateJson = document.getElementById('text-by-generate-json');
const buttonGenerateJson = document.getElementById('generate-json');
const textareaOutput = document.getElementById('textarea-output');
const textByCopyToClipboard = document.getElementById(
	'text-by-copy-to-clipboard',
);
const buttonCopyToClipboard = document.getElementById('copy-to-clipboard');
const buttonDownload = document.getElementById('download');

textareaOutput.value = '';

//// Sample data the user can load if they don’t have my Excel file:

const sampleDataJson = [
	{
		Lemma: 'vocābulum',
		PartOfSpeech: 'Noun',
		Meanings: 'word',
		Genders: ['neuter'],
	},
	{
		Lemma: 'excellēns',
		PartOfSpeech: 'Adjective',
		Meanings: 'excellent; distinguished',
	},
	{
		Lemma: 'excellō',
		PartOfSpeech: 'Verb',
		Meanings: 'excel; be distinguished; ‘excelsus’ = distinguished',
		Conjugations: [3],
		PerfectStems: ['excellu'],
		SupineStems: ['excels'],
	},
	{
		Lemma: 'Latīnus[adj]',
		PartOfSpeech: 'Adjective',
		Meanings: 'Latin',
		ParsingsToExclude: ['comparative', 'superlative'],
	},
	{
		Lemma: 'Latīnus[prn]',
		PartOfSpeech: 'Proper noun',
		Meanings:
			'king who welcomed Aeneas to Latium; Latinus Silvius fourth king of Alba Longa',
		Genders: ['masculine'],
	},
	{
		Lemma: 'ūtilis',
		PartOfSpeech: 'Adjective',
		Meanings: 'useful',
	},
	{
		Lemma: 'tabula',
		PartOfSpeech: 'Noun',
		Meanings: 'board; tablet',
		Declensions: [1],
		Genders: ['feminine'],
	},
	{
		Lemma: 'ā',
		PartOfSpeech: 'Noun',
		Meanings: 'letter Aa',
		Genders: ['neuter'],
		Declensions: [0],
	},
	{
		Lemma: 'ab',
		PartOfSpeech: 'Preposition',
		Meanings: 'from; by; since',
		Forms: {
			unencliticized: ['ā', 'ab', 'abs'],
			ne: ['āne'],
			que: ['āque', 'absque'],
			ve: ['āve'],
		},
	},
	{
		Lemma: 'abarceō',
		PartOfSpeech: 'Verb',
		Meanings: 'keep away',
		Conjugations: [2],
	},
	{
		Lemma: 'abavia',
		PartOfSpeech: 'Noun',
		Meanings: 'great-great-grandmother',
		Declensions: [1],
		Genders: ['feminine'],
	},
	{
		Lemma: 'abavus',
		PartOfSpeech: 'Noun',
		Meanings: 'great-great-grandfather',
		Genders: ['masculine'],
	},
	{
		Lemma: 'abdicō',
		PartOfSpeech: 'Verb',
		Meanings: 'deny; abdicate; renounce',
		Conjugations: [1],
	},
	{
		Lemma: 'abdīcō',
		PartOfSpeech: 'Verb',
		Meanings: 'deny (an omen or right)',
		Conjugations: [3],
		PerfectStems: ['abdīx'],
		SupineStems: ['abdict'],
		ReplacementForms: {
			imperative: {
				active: {
					present: {
						singular: {
							second: ['abdīc'],
						},
					},
				},
			},
		},
	},
];

function prettyPrintJson(text) {
	return JSON.stringify(text, null, '\t')
		.replace(/(?<=": \[)\n\s*/g, '') // Delete newline at start of array
		.replace(/(?<="|\d)\n\s*(?=\])/g, '') // Delete newline at end of array
		.replace(/\n\s+(?=[^:{}]+\n)/g, ' '); // Delete newlines between array items
}

const sampleData = prettyPrintJson(sampleDataJson);

//// Functions used in `generateJson`:

const clearTextMessages = () => {
	textByGenerateJson.textContent = '';
	textByCopyToClipboard.textContent = '';
};

const clearInputs = () => {
	textareaInput.value = '';
	textareaOutput.value = '';
	clearTextMessages();
};

const warnOfEmptyInput = () => {
	clearTextMessages();
	textByGenerateJson.textContent = 'Nothing to generate Json from!';
};

const warnOfEmptyOutput = () => {
	clearTextMessages();
	textByCopyToClipboard.textContent = 'Nothing to copy or download!';
};

//// Functions called by buttons:

const generateJson = () => {
	clearTextMessages();
	clearOutputObject();
	textByGenerateJson.textContent = 'Generating Json, please wait...';
	const allInputRows = JSON.parse(textareaInput.value);

	convertInputToOutputData(allInputRows);

	displayOutput();
	textByGenerateJson.textContent = 'Json generated!';
};

const displayOutput = () => {
	textareaOutput.value = prettyPrintJson(outputAsObject);
};

const copyToClipboard = () => {
	clearTextMessages();
	textByCopyToClipboard.textContent = 'Copying to clipboard...';
	textareaOutput.select();
	document.execCommand('copy');
	textByCopyToClipboard.textContent = 'Copied!';
};

const download = () => {
	let a = document.createElement('a');
	a.setAttribute(
		'href',
		'data:text/plain;charset=utf-8,' +
			encodeURIComponent(textareaOutput.value.replace(/\n/g, '\r\n')),
	);
	a.setAttribute('download', 'words-from-collator_mongo.json');
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	clearTextMessages();
};

//// Event listeners.

buttonClearInputs.addEventListener('click', () => {
	clearInputs();
});

buttonLoadSampleData.addEventListener('click', () => {
	textareaInput.value = sampleData;
	clearTextMessages();
});

buttonGenerateJson.addEventListener('click', () => {
	if (textareaInput.value === '') {
		warnOfEmptyInput();
	} else {
		generateJson();
	}
});

buttonCopyToClipboard.addEventListener('click', () => {
	if (textareaOutput.value === '') {
		warnOfEmptyOutput();
	} else {
		copyToClipboard();
	}
});

buttonDownload.addEventListener('click', () => {
	if (textareaOutput.value === '') {
		warnOfEmptyOutput();
	} else {
		download();
	}
});
