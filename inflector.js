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

const mergeObjects = (formsObject, objectToMerge) => {
	if (!objectToMerge) {
		return formsObject;
	}
	if (!formsObject) {
		console.warn(`formsObject is ${formsObject}`);
		return {};
	}
	if (Array.isArray(formsObject)) {
		return formsObject.concat(objectToMerge);
	}
	//// Take `formsObject` & merge properties with the same key in the two objects.
	const objectWithSamePropertiesMerged = Object.entries(formsObject)
		.filter(([key, obj]) => obj !== null && obj !== undefined)
		.map(([key, obj]) => [key, mergeObjects(obj, objectToMerge[key])])
		.reduce((accumulated, current) => {
			accumulated[current[0]] = current[1];
			return accumulated;
		}, {});

	//// Merge properties in `objectToMerge` that are not in `formsObject`.
	if (Object.keys(objectToMerge).find(key => !objectWithSamePropertiesMerged.hasOwnProperty(key))) {
		return Object.entries(objectToMerge)
			.filter((key, obj) => !objectWithSamePropertiesMerged.hasOwnProperty(key))
			.reduce((accumulated, current) => {
				accumulated[current[0]] = current[1];
				return accumulated;
			}, objectWithSamePropertiesMerged);
	}
	return objectWithSamePropertiesMerged;
}

const replaceFieldsInObjects = (formsObject, replacementObject) => {
	if (!replacementObject) {
		return formsObject;
	}
	if (!formsObject) {
		console.warn(`formsObject is ${formsObject}`);
		return {};
	}
	if (Array.isArray(formsObject)) {
		return replacementObject;
	}
	//// Take `formsObject` & merge properties with the same key in the two objects.
	const objectWithSamePropertiesMerged = Object.entries(formsObject)
		.filter(([key, obj]) => obj !== null && obj !== undefined)
		.map(([key, obj]) => [key, replaceFieldsInObjects(obj, replacementObject[key])])
		.reduce((accumulated, current) => {
			accumulated[current[0]] = current[1];
			return accumulated;
		}, {});

	//// Merge properties in `replacementObject` that are not in `formsObject`.
	if (Object.keys(replacementObject).find(key => !objectWithSamePropertiesMerged.hasOwnProperty(key))) {
		return Object.entries(replacementObject)
			.filter((key, obj) => !objectWithSamePropertiesMerged.hasOwnProperty(key))
			.reduce((accumulated, current) => {
				accumulated[current[0]] = current[1];
				return accumulated;
			}, objectWithSamePropertiesMerged);
	}
	return objectWithSamePropertiesMerged;
}

const joinStemsToEndings = (stems, endings) => {
	const stemsArray = Array.isArray(stems) ? stems : [stems];
	const endingsArray = Array.isArray(endings) ? endings : [endings];
	return stemsArray.flatMap(stem => endingsArray.map(ending => stem + ending));
}

const generateComparativeForms = (comparativeStems) => {
	return {
		masculine: {
			singular: {
				nominative: joinStemsToEndings(comparativeStems, 'or'),
				vocative: joinStemsToEndings(comparativeStems, 'or'),
				accusative: joinStemsToEndings(comparativeStems, 'ōrem'),
				genitive: joinStemsToEndings(comparativeStems, 'ōris'),
				dative: joinStemsToEndings(comparativeStems, 'ōrī'),
				ablative: joinStemsToEndings(comparativeStems, 'ōre'),
			},
			plural: {
				nominative: joinStemsToEndings(comparativeStems, 'ōrēs'),
				vocative: joinStemsToEndings(comparativeStems, 'ōrēs'),
				accusative: joinStemsToEndings(comparativeStems, ['ōrēs', 'ōrīs']),
				genitive: joinStemsToEndings(comparativeStems, 'ōrum'),
				dative: joinStemsToEndings(comparativeStems, 'ōribus'),
				ablative: joinStemsToEndings(comparativeStems, 'ōribus'),
			},
		},
		feminine: {
			singular: {
				nominative: joinStemsToEndings(comparativeStems, 'or'),
				vocative: joinStemsToEndings(comparativeStems, 'or'),
				accusative: joinStemsToEndings(comparativeStems, 'ōrem'),
				genitive: joinStemsToEndings(comparativeStems, 'ōris'),
				dative: joinStemsToEndings(comparativeStems, 'ōrī'),
				ablative: joinStemsToEndings(comparativeStems, 'ōre'),
			},
			plural: {
				nominative: joinStemsToEndings(comparativeStems, 'ōrēs'),
				vocative: joinStemsToEndings(comparativeStems, 'ōrēs'),
				accusative: joinStemsToEndings(comparativeStems, ['ōrēs', 'ōrīs']),
				genitive: joinStemsToEndings(comparativeStems, 'ōrum'),
				dative: joinStemsToEndings(comparativeStems, 'ōribus'),
				ablative: joinStemsToEndings(comparativeStems, 'ōribus'),
			},
		},
		neuter: {
			singular: {
				nominative: joinStemsToEndings(comparativeStems, 'us'),
				vocative: joinStemsToEndings(comparativeStems, 'us'),
				accusative: joinStemsToEndings(comparativeStems, 'us'),
				genitive: joinStemsToEndings(comparativeStems, 'ōris'),
				dative: joinStemsToEndings(comparativeStems, 'ōrī'),
				ablative: joinStemsToEndings(comparativeStems, 'ōre'),
			},
			plural: {
				nominative: joinStemsToEndings(comparativeStems, 'ōra'),
				vocative: joinStemsToEndings(comparativeStems, 'ōra'),
				accusative: joinStemsToEndings(comparativeStems, 'ōra'),
				genitive: joinStemsToEndings(comparativeStems, 'ōrum'),
				dative: joinStemsToEndings(comparativeStems, 'ōribus'),
				ablative: joinStemsToEndings(comparativeStems, 'ōribus'),
			},
		},
	};
}

const generateSuperlativeForms = (superlativeStems) => {
	return {
		masculine: {
			singular: {
				nominative: joinStemsToEndings(superlativeStems, 'us'),
				vocative: joinStemsToEndings(superlativeStems, 'e'),
				accusative: joinStemsToEndings(superlativeStems, 'um'),
				genitive: joinStemsToEndings(superlativeStems, 'ī'),
				dative: joinStemsToEndings(superlativeStems, 'ō'),
				ablative: joinStemsToEndings(superlativeStems, 'ō'),
			},
			plural: {
				nominative: joinStemsToEndings(superlativeStems, 'ī'),
				vocative: joinStemsToEndings(superlativeStems, 'ī'),
				accusative: joinStemsToEndings(superlativeStems, 'ōs'),
				genitive: joinStemsToEndings(superlativeStems, 'ōrum'),
				dative: joinStemsToEndings(superlativeStems, 'īs'),
				ablative: joinStemsToEndings(superlativeStems, 'īs'),
			},
		},
		feminine: {
			singular: {
				nominative: joinStemsToEndings(superlativeStems, 'a'),
				vocative: joinStemsToEndings(superlativeStems, 'a'),
				accusative: joinStemsToEndings(superlativeStems, 'am'),
				genitive: joinStemsToEndings(superlativeStems, 'ae'),
				dative: joinStemsToEndings(superlativeStems, 'ae'),
				ablative: joinStemsToEndings(superlativeStems, 'ā'),
			},
			plural: {
				nominative: joinStemsToEndings(superlativeStems, 'ae'),
				vocative: joinStemsToEndings(superlativeStems, 'ae'),
				accusative: joinStemsToEndings(superlativeStems, 'ās'),
				genitive: joinStemsToEndings(superlativeStems, 'ārum'),
				dative: joinStemsToEndings(superlativeStems, 'īs'),
				ablative: joinStemsToEndings(superlativeStems, 'īs'),
			},
		},
		neuter: {
			singular: {
				nominative: joinStemsToEndings(superlativeStems, 'um'),
				vocative: joinStemsToEndings(superlativeStems, 'um'),
				accusative: joinStemsToEndings(superlativeStems, 'um'),
				genitive: joinStemsToEndings(superlativeStems, 'ī'),
				dative: joinStemsToEndings(superlativeStems, 'ō'),
				ablative: joinStemsToEndings(superlativeStems, 'ō'),
			},
			plural: {
				nominative: joinStemsToEndings(superlativeStems, 'a'),
				vocative: joinStemsToEndings(superlativeStems, 'a'),
				accusative: joinStemsToEndings(superlativeStems, 'a'),
				genitive: joinStemsToEndings(superlativeStems, 'ōrum'),
				dative: joinStemsToEndings(superlativeStems, 'īs'),
				ablative: joinStemsToEndings(superlativeStems, 'īs'),
			},
		},
	};
}

////
//// Functions for building the output Json:
////

const inflectFuncs = {
	"Adjective": ({Lemma, PartOfSpeech, ...rest}) => {
		if (rest.Forms) {
			return multiplyWithEnclitics(rest.Forms);
		}
		const lemma = removeBrackets(Lemma);
		const declensionsString = JSON.stringify(rest.Declensions)
		//// 1st/2nd-declension adjectives
		if (declensionsString === "[1,2]"
			|| (lemma.endsWith("us") && declensionsString !== "[3]")
		) {
			const stem = Lemma.substring(0, lemma.length - 2);
			const comparativeStems = rest.ComparativeStems || stem + "i";
			const superlativeStems = rest.SuperlativeStems || stem + 'issim';

			//// Eg Sīdōnius => Sīdōniī, Sīdōnī
			const getPositiveMasculineSingularGenitiveForms = () => {
				const uncontracted = stem + 'ī';
				const contracted = stem.substring(0, stem.length - 1) + 'ī';
				const contractedWithAcute = contracted
					.replace(/a(?=[bcdfglmnprstv]ī$)/, 'á')
					.replace(/e(?=[bcdfglmnprstv]ī$)/, 'é')
					.replace(/i(?=[bcdfglmnprstv]ī$)/, 'í')
					.replace(/o(?=[bcdfglmnprstv]ī$)/, 'ó')
					.replace(/u(?=[bcdfglmnprstv]ī$)/, 'ú')
					.replace(/y(?=[bcdfglmnprstv]ī$)/, 'ý')
				if (stem.endsWith('i') || stem.endsWith("ï")) {
					return [uncontracted, ... new Set([contracted, contractedWithAcute])];
				}
				return [uncontracted];
			}

			const allUnencliticizedForms = {
				positive: {
					masculine: {
						singular: {
							nominative: [lemma],
							vocative: [stem + 'e'],
							accusative: [stem + 'um'],
							genitive: getPositiveMasculineSingularGenitiveForms(),
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
				comparative: generateComparativeForms(comparativeStems),
				superlative: generateSuperlativeForms(superlativeStems),
			};
			const withReplacements = replaceFieldsInObjects(allUnencliticizedForms, rest.ReplacementForms)
			const withEnclitics = multiplyWithEnclitics(withReplacements);
			const wantedForms = deleteUnwantedForms(withEnclitics, rest.ParsingsToExclude);
			return mergeObjects(wantedForms, rest.ExtraForms);
		}
		//// 3rd-declension adjectives
		const stem = (() => {
			if (rest.ObliqueStem) {
				return rest.ObliqueStem;
			}
			if (lemma.endsWith('āns')) {
				return lemma.replace(/āns$/, 'ant');
			}
			if (lemma.endsWith('ēns')) {
				return lemma.replace(/ēns$/, 'ent');
			}
			if (lemma.endsWith('ōns')) {
				return lemma.replace(/ōns$/, 'ont');
			}
			return lemma.substring(0, lemma.length - 2);
		})();
		const hasIStem = rest.HasIStem || false;
		const comparativeStems = rest.ComparativeStems || stem + "i";
		const superlativeStems = rest.SuperlativeStems || stem + 'issim';

		const allUnencliticizedForms = {
			positive: {
				masculine: {
					singular: {
						nominative: [lemma],
						vocative: [lemma],
						accusative: [stem + 'em'],
						genitive: [stem + 'is'],
						dative: [stem + 'ī'],
						ablative: [stem + (hasIStem ? 'ī' : 'e')],
					},
					plural: {
						nominative: [stem + 'ēs'],
						vocative: [stem + 'ēs'],
						accusative: [stem + 'ēs'],
						genitive: [stem + (hasIStem ? 'ium' : 'um')],
						dative: [stem + 'ibus'],
						ablative: [stem + 'ibus'],
					},
				},
				feminine: {
					singular: {
						nominative: [lemma],
						vocative: [lemma],
						accusative: [stem + 'em'],
						genitive: [stem + 'is'],
						dative: [stem + 'ī'],
						ablative: [stem + (hasIStem ? 'ī' : 'e')],
					},
					plural: {
						nominative: [stem + 'ēs'],
						vocative: [stem + 'ēs'],
						accusative: [stem + 'ēs'],
						genitive: [stem + (hasIStem ? 'ium' : 'um')],
						dative: [stem + 'ibus'],
						ablative: [stem + 'ibus'],
					},
				},
				neuter: {
					singular: {
						nominative: [lemma],
						vocative: [lemma],
						accusative: [lemma],
						genitive: [stem + 'is'],
						dative: [stem + 'ī'],
						ablative: [stem + (hasIStem ? 'ī' : 'e')],
					},
					plural: {
						nominative: [stem + (hasIStem ? 'ia' : 'a')],
						vocative: [stem + (hasIStem ? 'ia' : 'a')],
						accusative: [stem + (hasIStem ? 'ia' : 'a')],
						genitive: [stem + (hasIStem ? 'ium' : 'um')],
						dative: [stem + 'ibus'],
						ablative: [stem + 'ibus'],
					},
				},
			},
			comparative: generateComparativeForms(comparativeStems),
			superlative: generateSuperlativeForms(superlativeStems),
		};
		const withReplacements = replaceFieldsInObjects(allUnencliticizedForms, rest.ReplacementForms)
		const withEnclitics = multiplyWithEnclitics(withReplacements);
		const wantedForms = deleteUnwantedForms(withEnclitics, rest.ParsingsToExclude);
		return mergeObjects(wantedForms, rest.ExtraForms);
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
		const batchSize = 1_000;
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
				let incorrectComparatives = 0;
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
							// if (!isEqualSet(formsAsSet, expectedFormsAsSet)) {
							// 	console.log({
							// 		missingFromExcel: subtractSet(formsAsSet, expectedFormsAsSet),
							// 		for: lemma,
							// 	});
							// }
							// console.log({parsingData})
							const comparativeForm = parsingData.unencliticized?.comparative?.neuter?.singular?.nominative?.[0]
								?? parsingData.unencliticized?.comparative?.[0];
							if (comparativeForm) {
								if (!expectedFormsAsSet.has(comparativeForm)) {
									const lemmataToNotComplainAboutComparativesFor = [
										"iūrisperītus", "celeriter", "sērus", "posterus", "novus", "nōtus", "multus", "lūcidus", "limpidus", "inīquus", "grātus", "fīdus", "falsus", "aptus", "noviter", "altus", "inter"];
										if (!lemmataToNotComplainAboutComparativesFor.includes(lemma)) {
											console.log(`${lemma} should not have comparative form ${comparativeForm}`);
											// console.log(`${comparativeForm}`);
											// console.log(`${lemma}`);
											incorrectComparatives++;
										}
								}
							}
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
				console.warn(`There were ${incorrectComparatives} lemmata with unwanted comparatives.`);
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
