////
//// This file is used from the HTML page, or can be run by itself in Node.
//// It has a section at the end that only runs in Node.
//// The Node-only section reads from a hardcoded filepath, writes to a second
//// hardcoded filepath, and compares the output to a third hardcoded filepath.
////
//// Contents:
//// - Helper functions
//// - Functions for building the output Json
//// - Node-only code
////


////
//// Helper functions
////

const removeBrackets = (lemma) => {
	if (lemma.includes('[')) {
		return lemma.substring(0, lemma.indexOf('['));
	}
	return lemma;
}

const multiplyWithEnclitics = (parsingObject) => {
	if (parsingObject.unencliticized) {
		return parsingObject;
	}

	const addEnclitic = (object, enclitic) => {
		try {
			if (!object) {
				console.warn(`parsingObject is ${object}`);
				return {};
			}
			if (Array.isArray(object)) {
				return object.map(form => form + enclitic);
			}
			if (typeof object === "string") {
				console.error(`parsingObject is a string: ${object}`);
				throw `parsingObject is a string: ${object}`;
			}
			return Object.entries(object)
				.filter(([key, obj]) => obj !== null && obj !== undefined)
				.map(([key, obj]) => [key, addEnclitic(obj, enclitic)])
				.reduce((accumulated, current) => {
					accumulated[current[0]] = current[1];
					return accumulated;
				}, {});
		}
		catch (error) {
			console.error(`Error in addEnclitics(${object}): error`);
			return {}
		}
	}

	return {
		'unencliticized': parsingObject,
		'ne': addEnclitic(parsingObject, 'ne'),
		'que': addEnclitic(parsingObject, 'que'),
		've': addEnclitic(parsingObject, 've'),
	}
}

const deleteUnwantedForms = (formsObject, unwantedParsings) => {
	if (!unwantedParsings) {
		return formsObject;
	}
	if (!formsObject) {
		console.warn(`formsObject is ${formsObject}`);
		return {};
	}
	if (Array.isArray(formsObject)) {
		return formsObject;
	}
	return Object.entries(formsObject)
		.filter(([key, obj]) => obj !== null && obj !== undefined)
		.filter(([key, obj]) => !unwantedParsings.includes(key))
		.map(([key, obj]) => [key, deleteUnwantedForms(obj, unwantedParsings)])
		.reduce((accumulated, current) => {
			accumulated[current[0]] = current[1];
			return accumulated;
		}, {});
}

////
//// Functions for building the output Json:
////

const inflectFuncs = {
	"Adjective": ({Lemma, PartOfSpeech, ...rest}) => {
		if (rest.Forms) {
			return multiplyWithEnclitics(rest.Forms);
		}
		//// 1st/2nd-declension adjectives
		if (Lemma.endsWith("us")) {
			const stem = Lemma.substring(0, Lemma.length - 2)
			const allUnencliticizedForms = {
				positive: {
					masculine: {
						singular: {
							nominative: [Lemma],
							vocative: [stem + 'e'],
							accusative: [stem + 'um'],
							genitive: [stem + 'ī'],
							dative: [stem + 'ō'],
							ablative: [stem + 'ō'],
						},
						plural: {
							nominative: [stem + 'ī'],
							vocative: [stem + 'ī'],
							accusative: [stem + 'ōs'],
							genitive: [stem + 'ōrum'],
							dative: [stem + 'īs'],
							ablative: [stem + 'īs'],
						},
					},
					feminine: {
						singular: {
							nominative: [stem + 'a'],
							vocative: [stem + 'a'],
							accusative: [stem + 'am'],
							genitive: [stem + 'ae'],
							dative: [stem + 'ae'],
							ablative: [stem + 'ā'],
						},
						plural: {
							nominative: [stem + 'ae'],
							vocative: [stem + 'ae'],
							accusative: [stem + 'ās'],
							genitive: [stem + 'ārum'],
							dative: [stem + 'īs'],
							ablative: [stem + 'īs'],
						},
					},
					neuter: {
						singular: {
							nominative: [stem + 'um'],
							vocative: [stem + 'um'],
							accusative: [stem + 'um'],
							genitive: [stem + 'ī'],
							dative: [stem + 'ō'],
							ablative: [stem + 'ō'],
						},
						plural: {
							nominative: [stem + 'a'],
							vocative: [stem + 'a'],
							accusative: [stem + 'a'],
							genitive: [stem + 'ōrum'],
							dative: [stem + 'īs'],
							ablative: [stem + 'īs'],
						},
					},
				},
				comparative: {
					masculine: {
						singular: {
							nominative: [stem + 'ior'],
							vocative: [stem + 'ior'],
							accusative: [stem + 'iōrem'],
							genitive: [stem + 'iōris'],
							dative: [stem + 'iōrī'],
							ablative: [stem + 'iōre'],
						},
						plural: {
							nominative: [stem + 'iōrēs'],
							vocative: [stem + 'iōrēs'],
							accusative: [stem + 'iōrēs'],
							genitive: [stem + 'iōrum'],
							dative: [stem + 'iōribus'],
							ablative: [stem + 'iōribus'],
						},
					},
					feminine: {
						singular: {
							nominative: [stem + 'ior'],
							vocative: [stem + 'ior'],
							accusative: [stem + 'iōrem'],
							genitive: [stem + 'iōris'],
							dative: [stem + 'iōrī'],
							ablative: [stem + 'iōre'],
						},
						plural: {
							nominative: [stem + 'iōrēs'],
							vocative: [stem + 'iōrēs'],
							accusative: [stem + 'iōrēs'],
							genitive: [stem + 'iōrum'],
							dative: [stem + 'iōribus'],
							ablative: [stem + 'iōribus'],
						},
					},
					neuter: {
						singular: {
							nominative: [stem + 'ius'],
							vocative: [stem + 'ius'],
							accusative: [stem + 'ius'],
							genitive: [stem + 'iōris'],
							dative: [stem + 'iōrī'],
							ablative: [stem + 'iōre'],
						},
						plural: {
							nominative: [stem + 'iōra'],
							vocative: [stem + 'iōra'],
							accusative: [stem + 'iōra'],
							genitive: [stem + 'iōrum'],
							dative: [stem + 'iōribus'],
							ablative: [stem + 'iōribus'],
						},
					},
				},
				superlative: {
					masculine: {
						singular: {
							nominative: [stem + 'issimus'],
							vocative: [stem + 'issime'],
							accusative: [stem + 'issimum'],
							genitive: [stem + 'issimī'],
							dative: [stem + 'issimō'],
							ablative: [stem + 'issimō'],
						},
						plural: {
							nominative: [stem + 'issimī'],
							vocative: [stem + 'issimī'],
							accusative: [stem + 'issimōs'],
							genitive: [stem + 'issimōrum'],
							dative: [stem + 'issimīs'],
							ablative: [stem + 'issimīs'],
						},
					},
					feminine: {
						singular: {
							nominative: [stem + 'issima'],
							vocative: [stem + 'issima'],
							accusative: [stem + 'issimam'],
							genitive: [stem + 'issimae'],
							dative: [stem + 'issimae'],
							ablative: [stem + 'issimā'],
						},
						plural: {
							nominative: [stem + 'issimae'],
							vocative: [stem + 'issimae'],
							accusative: [stem + 'issimās'],
							genitive: [stem + 'issimārum'],
							dative: [stem + 'issimīs'],
							ablative: [stem + 'issimīs'],
						},
					},
					neuter: {
						singular: {
							nominative: [stem + 'issimum'],
							vocative: [stem + 'issimum'],
							accusative: [stem + 'issimum'],
							genitive: [stem + 'issimī'],
							dative: [stem + 'issimō'],
							ablative: [stem + 'issimō'],
						},
						plural: {
							nominative: [stem + 'issima'],
							vocative: [stem + 'issima'],
							accusative: [stem + 'issima'],
							genitive: [stem + 'issimōrum'],
							dative: [stem + 'issimīs'],
							ablative: [stem + 'issimīs'],
						},
					},
				},
			};
			return deleteUnwantedForms(multiplyWithEnclitics(allUnencliticizedForms));
		}
		//// 3rd-declension adjectives
		return {};
	},
	"Conjunction": ({Lemma, PartOfSpeech, ...rest}) => {
		return [...new Set(rest.Forms ?? []).add(removeBrackets(Lemma))];
	},
	"Adverb": ({Lemma, PartOfSpeech, ...rest}) => {
		if (rest.Forms) {
			return multiplyWithEnclitics(rest.Forms);
		}
		const positive = removeBrackets(Lemma);
		const stem = rest.ObliqueStem || positive.replace(/(ē|iter|(?<=c)ter|er|im|om|um|ō|e|ī)$/, "");

		if (rest.IsIndeclinable
			|| positive === stem
			|| (!rest.ObliqueStem && (positive.endsWith("ātim") || positive.endsWith("ūtim")))
		) {
			return multiplyWithEnclitics({positive: [positive]});
		}

		const comparative = stem + "ius";
		const superlative = (/[bce]r$/.test(stem) ? stem.replace(/e?r$/, "errimē") : stem + "issimē");
		const allForms = {
			positive: [positive],
			comparative: [comparative],
			superlative: [superlative]
		};
		const wantedForms = deleteUnwantedForms(allForms, rest.ParsingsToExclude);
		return multiplyWithEnclitics(wantedForms);
	},
	"Interjection": ({Lemma, PartOfSpeech, ...rest}) => {
		if (rest.Forms) {
			return rest.Forms;
		}
		return [removeBrackets(Lemma)];
	},
	"Noun": ({Lemma, PartOfSpeech, ...rest}) => {
		return {};
	},
	"Preposition": ({Lemma, PartOfSpeech, ...rest}) => {
		if (rest.Forms && Array.isArray(rest.Forms)) {
			return multiplyWithEnclitics([... new Set(rest.Forms).add(removeBrackets(Lemma))]);
		}
		if (rest.Forms) {
			return multiplyWithEnclitics(rest.Forms);
		}
		return multiplyWithEnclitics([removeBrackets(Lemma)]);
	},
	"Pronoun": ({Lemma, PartOfSpeech, ...rest}) => {
		return {};
	},
	"Proper noun": ({Lemma, PartOfSpeech, ...rest}) => {
		return {};
	},
	"Verb": ({Lemma, PartOfSpeech, ...rest}) => {
		return {};
	},
}

const convertParsingObjectToFormsArray = (parsingObject) =>{
	if (!parsingObject) {
		console.warn(`parsingObject is ${parsingObject}`);
		return [];
	}
	if (Array.isArray(parsingObject)) {
		return parsingObject;
	}
	if (typeof parsingObject === "string") {
		console.warn(`parsingObject should is a string: ${parsingObject}`)
	}
	return Object.values(parsingObject)
		// .filter(object => object !== null && object !== undefined)
		.flatMap(object => convertParsingObjectToFormsArray(object));
}
const convertParsingObjectToFormsSet = (parsingObject) => {
	return new Set(convertParsingObjectToFormsArray(parsingObject));
}
// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#implementing_basic_set_operations
function isSuperset(set, subset) {
  for (const elem of subset) {
    if (!set.has(elem)) {
      return false;
    }
  }
  return true;
}
function isEqualSet(set1, set2) {
	if (set1.size !== set2.size) {
		return false;
	}
	return isSuperset(set1, set2);
}
function subtractSet(superset, setToSubtract) {
  const _difference = new Set(superset);
  for (const elem of setToSubtract) {
    _difference.delete(elem);
  }
  return _difference;
}

//// `outputAsObject` gets modified by `convertInputToOutputData` inside `generateJson`
//// and either gets displayed in the second text-area by `displayOutput` (in web.js)
//// or gets written to a file (in the Node-only section).
let outputAsObject = {};

const validPartsOfSpeech = Object.keys(inflectFuncs);

const clearOutputObject = () => outputAsObject = {};

const convertInputToOutputData = (lemmata) => {
	clearOutputObject(); // Clear the output in case there’s anything from previous runs.
	const countRows = lemmata.length;

	//// For each line of values in the input...
	for (let i = 0; i < countRows; i++) {
		const lemma = lemmata[i];

		if (!lemma.Lemma) {
			console.error(
				`Lemma property missing from lemma ${i}`
			);
			continue;
		}

		if (!lemma.PartOfSpeech) {
			console.error(
				`PartOfSpeech property missing from lemma ${i}`
			);
			continue;
		}

		if (!validPartsOfSpeech.includes(lemma.PartOfSpeech)) {
			console.error(
				`Not a valid PartOfSpech: ${lemma.PartOfSpeech}`
			);
			continue;
		}

		try {
			const parsingData = inflectFuncs[lemma.PartOfSpeech](lemma);

			if (Object.keys(parsingData).length === 0) {
				// console.log(`Inflection function has not been defined for ${lemma.PartOfSpeech}.`);
			}
			outputAsObject[lemma.Lemma] = parsingData;
		} catch (error) {
			console.error(
				`Error when processing lemma ${i} (${lemma.Lemma}) — ${error}`
			);
		}
	}
	return outputAsObject;
};


////
//// Code that only runs in Node:
//// (Divided into functions for easier commenting-out when debugging.)
////

if (typeof require !== 'undefined') {

	const fs = require('fs');

	const runAllWords = () => {

		//// Input data look like "vocābulōrum\tvocābulum\rexcellentium\texcellēns excellō\r"
		const inputFileUrl =
			'C:/Users/Duncan Ritchie/Documents/Code/velutSideAssets/Json/lemmata-nongenerated-fields.json';
		const inputLemmata = require(inputFileUrl);
		//// Output data are generated in batches & each batch is written to a file.
		//// This allows me to track the output in Git without tracking a huge file.
		const getOutputFileUrlForBatch = (batchNumber) =>
			`C:/Users/Duncan Ritchie/Documents/Code/velutSideAssets/Json/words-from-inflector_mongo_batch${batchNumber}.json`;
		const batchSize = 5_000;
		//// The output batches are concatenated into one file, for Git to ignore and me to import to MongoDB.
		const outputFileUrl =
			'C:/Users/Duncan Ritchie/Documents/Code/velutSideAssets/Json/words-from-inflector_mongo.json';
		//// For regression testing, I have a file of expected output, that the actual output is compared against.
		const expectedOutputFileUrl =
			'C:/Users/Duncan Ritchie/Documents/Code/velutSideAssets/Json/lemmata-from-collator_mongo.json';

		try {
			let batchFilepaths = [];

			const generateOutputAndSaveInBatches = () => {
				console.time('generatingOutput');

				//// Eg [1,2,3,4,5,6,7], 2 => [[1,2],[3,4],[5,6],[7]]
				// from https://stackoverflow.com/a/54029307
				const splitArrayIntoBatches = (array, size) =>
					array.length > size
						? [array.slice(0, size), ...splitArrayIntoBatches(array.slice(size), size)]
						: [array];
				const inputLemmataBatched = splitArrayIntoBatches(inputLemmata, batchSize);

				let outputRowsBatched = [];
				inputLemmataBatched.forEach((batch, index, array) => {
					const outputBatch = convertInputToOutputData(batch);
					outputRowsBatched.push({...outputBatch});
				});

				batchFilepaths = outputRowsBatched
					.map((batch, batchNumber) => {
						const filepath = getOutputFileUrlForBatch(batchNumber)
						fs.writeFileSync(filepath, JSON.stringify(batch, null, '\t'));
						return filepath;
					});
				console.log('Output all data! See your file at ' + outputFileUrl + ' or ' + batchFilepaths);

				console.timeEnd('generatingOutput');
			}

			const concatenateBatches = () => {
				console.time('concatenatingOutput');

				const combinedOutput = {};
				batchFilepaths.forEach((filename) =>{
					const outputBatch = require(filename);
					Object.entries(outputBatch).forEach(([lemma, parsingData]) => combinedOutput[lemma] = parsingData);
				});

				fs.writeFileSync(outputFileUrl, JSON.stringify(combinedOutput));

				console.timeEnd('concatenatingOutput');
			}

			const checkAgainstExpected = () => {
				console.time('checkingOutput');

				// const output = require(outputFileUrl);
				const expectedOutput = require(expectedOutputFileUrl);

				let successCount = 0;
				let errorCount = 0;
				let totalLemmata = 0;
				// const totalLemmata = outputEntries.length;

				batchFilepaths.forEach((filename) => {
					const outputBatch = require(filename);
					const outputEntries = Object.entries(outputBatch);

					for ([lemma, parsingData] of outputEntries) {
						totalLemmata++;

						if (!parsingData) continue;
						if (Object.keys(parsingData).length === 0) continue;

						const formsAsSet = convertParsingObjectToFormsSet(parsingData);
						const expectedFormsAsSet = convertParsingObjectToFormsSet(expectedOutput[lemma]);

						if (isSuperset(formsAsSet, expectedFormsAsSet)) {
							successCount++;
							// console.log('Yay! ' + lemma);
						} else {
							errorCount++;
							console.error({
								expected: expectedFormsAsSet,
								actual: formsAsSet,
								missing: subtractSet(expectedFormsAsSet, formsAsSet),
								for: lemma,
							});
							// }
						}
					}
				});
				const skippedCount = totalLemmata - errorCount - successCount;
				console.warn(`There were ${errorCount} mismatches (and ${successCount} successes and ${skippedCount} skipped) out of ${totalLemmata} lemmata.`);

				console.timeEnd('checkingOutput');
			};

			generateOutputAndSaveInBatches();
			concatenateBatches();
			checkAgainstExpected();

		} catch (err) {
			console.error(err);
		}
	};

	runAllWords();
}
