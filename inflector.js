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

const multiplyWithEnclitics = (parsingObject, addIAfterC = false) => {
	if (parsingObject.unencliticized || parsingObject.ne || parsingObject.que || parsingObject.ve) {
		return parsingObject;
	}

	const addEnclitic = (object, enclitic) => {
		try {
			if (!object) {
				console.warn(`parsingObject is ${object} in addEnclitic`);
				return {};
			}
			if (Array.isArray(object)) {
				return object
					.filter(form => /[aeiouyāēīōūȳ]/i.test(form)) // Forms with no vowels (eg ‘st') should not get an enclitic
					.map(form => {
						if (form.endsWith('c') && addIAfterC && enclitic === 'ne') {
							return removeAcutes(form) + 'i' + enclitic;
						}
						return removeAcutes(form) + enclitic;
				})
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
		console.warn(`formsObject is ${formsObject} inside deleteUnwantedForms`);
		return {};
	}
	if (Array.isArray(formsObject)) {
		return formsObject;
	}
	return Object.entries(formsObject)
		.filter(([key, obj]) => !unwantedParsings.includes(key))
		.map(([key, obj]) => [key, deleteUnwantedForms(obj, unwantedParsings)])
		.reduce((accumulated, current) => {
			accumulated[current[0]] = current[1];
			return accumulated;
		}, {});
}

//// This code is horrific but it seems to work.
const mergeObjects = (formsObject, objectToMerge) => {
	if (!objectToMerge) {
		return formsObject;
	}
	if (!formsObject) {
		console.warn(`formsObject is ${formsObject} inside mergeObjects`);
		return {};
	}
	if (Array.isArray(formsObject)) {
		if (!(Array.isArray(objectToMerge))) {
			console.warn({
				message: 'formsObject is array but objectToMerge is not',
			formsObject, objectToMerge
		})
		}
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
		const withMoreProps = Object.entries(objectToMerge)
			.filter((key, obj) => !objectWithSamePropertiesMerged.hasOwnProperty(key))
			.reduce((accumulated, current) => {
				accumulated[current[0]] = current[1];
				return accumulated;
			}, { ...objectWithSamePropertiesMerged });

		const finallyMerged = { ...withMoreProps, ...objectWithSamePropertiesMerged };
		return finallyMerged;
	}
	return objectWithSamePropertiesMerged;
}

const replaceFieldsInObjects = (formsObject, replacementObject) => {
	if (!replacementObject) {
		return formsObject;
	}
	if (!formsObject) {
		console.warn(`formsObject is ${formsObject} inside replaceFieldsInObjects`);
		return {};
	}
	if (Array.isArray(formsObject)) {
		if (!Array.isArray(replacementObject)) {
			console.warn({message: 'formsObject is array but replacementObject is not', formsObject, replacementObject})
		}
		return replacementObject;
	}
	else if (Array.isArray(replacementObject)) {
		return replacementObject;
	}
	//// Take `formsObject` & merge properties with the same key in the two objects.
	const objectWithSamePropertiesReplaced = Object.entries(formsObject)
		.filter(([key, obj]) => obj !== null && obj !== undefined)
		.map(([key, obj]) => [key, replaceFieldsInObjects(obj, replacementObject[key])])
		.reduce((accumulated, current) => {
			accumulated[current[0]] = current[1];
			return accumulated;
		}, {});

	//// Merge properties in `replacementObject` that are not in `formsObject`.
	if (Object.keys(replacementObject).find(key => !objectWithSamePropertiesReplaced.hasOwnProperty(key))) {
		return Object.entries(replacementObject)
			.filter((key, obj) => !objectWithSamePropertiesReplaced.hasOwnProperty(key))
			.reduce((accumulated, current) => {
				accumulated[current[0]] = current[1];
				return accumulated;
			}, objectWithSamePropertiesReplaced);
	}
	return objectWithSamePropertiesReplaced;
}

// Eg, plērusque is a [1,2]-declension adjective with -que suffixed
const markQueAsUnencliticized = (formsObject, lemmaHasQueEnding = false) => {
	if (!lemmaHasQueEnding) {
		return formsObject;
	}
	if (!formsObject) {
		console.warn(`formsObject is ${formsObject} inside markQueAsUnencliticized`);
		return formsObject;
	}
	if (!formsObject.que) {
		console.warn(`lemma is marked as having -que ending but no -que forms were generated`);
		return formsObject;
	}
	const newFormsObject = {...formsObject};
	delete newFormsObject.ne;
	delete newFormsObject.ve;
	delete newFormsObject.unencliticized;
	newFormsObject.unencliticized = newFormsObject.que;
	delete newFormsObject.que;
	return newFormsObject;
}

const deleteEmptyFields = (formsObject) => {
	if (!formsObject) {
		console.warn(`formsObject is ${formsObject} inside deleteUnwantedForms`);
		return {};
	}
	if (Array.isArray(formsObject)) {
		return formsObject;
	}
	return Object.entries(formsObject)
		.filter(([key, obj]) => obj)
		.map(([key, obj]) => [key, deleteEmptyFields(obj)])
		.filter(([key, obj]) => Object.values(obj).length)
		.reduce((accumulated, current) => {
			accumulated[current[0]] = current[1];
			return accumulated;
		}, {});
}

//// Returns formsObject but with lambda run on every form.
const runLambdaOnObject = (formsObject, lambda) => {
	if (!formsObject) {
		console.warn(`formsObject is ${formsObject} inside runLambdaOnObject`);
		return {};
	}
	if (Array.isArray(formsObject)) {
		return formsObject.flatMap(form => lambda(form));
	}
	return Object.entries(formsObject)
		.map(([key, obj]) => [key, runLambdaOnObject(obj, lambda)])
		.reduce((accumulated, current) => {
			accumulated[current[0]] = current[1];
			return accumulated;
		}, {});
}

const consoleLogAsJson = (...args) => {
	if (!Array.isArray(args)) { 'args is not array: ' + JSON.stringify(args)}
	const object = {};
	args.forEach(objectToLog => {
		Object.entries(objectToLog).forEach(([key, value]) => {
			object[key] = JSON.stringify(value)
		})
	})
	console.log(object);
}

const removeAcutes = (string) => {
	return string
		.replaceAll('ḗ', 'ē')
		// More `replaceAll` calls may need to be added here.
		;
}

const ensureIsArray = (possibleArray) => {
	return Array.isArray(possibleArray) ? possibleArray : [possibleArray];
}

//// Returns an array with all the values of `stems`
//// concatenated with all the values of `endings`.
//// Adds diaereses if needed so that 'Tana' + 'e' => 'Tanaë'
//// but 'Tana' + 'em' => 'Tanaem'.
//// (The velut Word Data Generator interprets final vowel+'m' as nasalised
//// before it interprets 'ae'/'au'/'oe' as a diphthong, which means that
//// non-diphthong 'ae'/'au'/'oe' doesn’t need the diaeresis if it’s before final 'm'.)
const joinStemsToEndings = (stems, endings) => {
	const stemsArray = ensureIsArray(stems);
	const endingsArray = ensureIsArray(endings);
	return stemsArray.flatMap(stem => {
		return endingsArray.map(ending => {
			return (stem + '~' + ending)
				.replace(/a~e(?!m$)/, 'aë')
				.replace(/a~u(?!m$)/, 'aü')
				.replace(/o~e(?!m$)/, 'oë')
				.replace('~', '')
			;
		});
	});
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

// This should be passed into replaceFieldsInForms for intransitive verbs,
// to clear out passive non-impersonal forms.
const emptyFieldsForIntransitiveVerbs = {
	indicative: {
		passive: {
			present: {
				singular: {
					first: [],
					second: [],
				},
				plural: [],
			},
			imperfect: {
				singular: {
					first: [],
					second: [],
				},
				plural: [],
			},
			future: {
				singular: {
					first: [],
					second: [],
				},
				plural: [],
			},
		},
	},
	subjunctive: {
		passive: {
			present: {
				singular: {
					first: [],
					second: [],
				},
				plural: [],
			},
			imperfect: {
				singular: {
					first: [],
					second: [],
				},
				plural: [],
			},
		},
	},
	imperative: {
		passive: {
			present: {
				singular: {
					second: [],
				},
				plural: [],
			},
			future: {
				singular: {
					second: [],
				},
				plural: [],
			},
		},
	},
	participle: {
		passive: {
			past: {
				masculine: [],
				feminine: [],
				neuter: {
					plural: [],
				},
			},
			future: {
				masculine: [],
				feminine: [],
				neuter: {
					plural: [],
				},
			},
		},
	},
	supine: {
		ablative: []
	}
};

// This function should be called at the end of each inflection function.
function applyFieldsToForms(allUnencliticizedForms, rest) {
	const withReplacements = replaceFieldsInObjects(allUnencliticizedForms, rest.ReplacementForms);
	const withExtraForms = mergeObjects(withReplacements, rest.ExtraForms);
	const withEnclitics = multiplyWithEnclitics(withExtraForms);
	const withReplacementEncliticizedForms = replaceFieldsInObjects(withEnclitics, rest.ReplacementEncliticizedForms);
	const withExtraEncliticizedForms = mergeObjects(withReplacementEncliticizedForms, rest.ExtraEncliticizedForms);
	const withQueLemmaHandled = markQueAsUnencliticized(withExtraEncliticizedForms, rest.IsLemmaInQue);
	const wantedForms = deleteUnwantedForms(withQueLemmaHandled, rest.ParsingsToExclude);
	const withoutEmptyFields = deleteEmptyFields(wantedForms);
	return withoutEmptyFields;
}

////
//// Functions for building the output Json:
////

const inflectFuncs = {
	"Adjective": ({Lemma, PartOfSpeech, ...rest}) => {
		if (rest.Forms) {
			return multiplyWithEnclitics(rest.Forms);
		}
		const lemma = rest.IsLemmaInQue ? removeBrackets(Lemma).replace(/que$/, '') : removeBrackets(Lemma);

		if (rest.IsIndeclinable) {
			const forms = { positive: {
				masculine: {
					singular: {
						nominative: [lemma],
						vocative: [lemma],
						accusative: [lemma],
						genitive: [lemma],
						dative: [lemma],
						ablative: [lemma],
					},
					plural: {
						nominative: [lemma],
						vocative: [lemma],
						accusative: [lemma],
						genitive: [lemma],
						dative: [lemma],
						ablative: [lemma],
					},
				},
				feminine: {
					singular: {
						nominative: [lemma],
						vocative: [lemma],
						accusative: [lemma],
						genitive: [lemma],
						dative: [lemma],
						ablative: [lemma],
					},
					plural: {
						nominative: [lemma],
						vocative: [lemma],
						accusative: [lemma],
						genitive: [lemma],
						dative: [lemma],
						ablative: [lemma],
					},
				},
				neuter: {
					singular: {
						nominative: [lemma],
						vocative: [lemma],
						accusative: [lemma],
						genitive: [lemma],
						dative: [lemma],
						ablative: [lemma],
					},
					plural: {
						nominative: [lemma],
						vocative: [lemma],
						accusative: [lemma],
						genitive: [lemma],
						dative: [lemma],
						ablative: [lemma],
					},
				},
			} };
			return applyFieldsToForms(forms, rest);
		}

		const declensionsString = rest.Declensions
			? JSON.stringify(rest.Declensions)
			: (
				(lemma.endsWith("us"))
				|| (lemma.endsWith("üs"))
				|| (lemma.endsWith("er"))
				|| (lemma.endsWith("a"))
				|| (lemma.endsWith("ī"))
			) ? "[1,2]"
				: "[3]";

		//// 1st/2nd-declension adjectives
		if (declensionsString === "[1,2]") {

			if (lemma.match(/[^q][eiu]us$/) && !rest.ParsingsToExclude) {
				console.warn("Please define ParsingsToExclude because adjectives in -eus, -ius, -uus generally don’t have comparative/superlative: " + Lemma);
			}

			const stems = ensureIsArray((() => {
				if (rest.ObliqueStems) { return rest.ObliqueStems; }
				if (lemma.endsWith('er')) { return lemma; }
				if (lemma.endsWith('a') | lemma.endsWith('ī')) { return lemma.substring(0, lemma.length - 1); }
				return lemma.substring(0, lemma.length - 2);
			})());
			const comparativeStems = rest.ComparativeStems || joinStemsToEndings(stems, "i");
			const superlativeStems = rest.SuperlativeStems
				|| (lemma.endsWith('er')
					? joinStemsToEndings(lemma, 'rim')
					: joinStemsToEndings(stems, 'issim'));

			//// Eg Sīdōnius => Sīdōniī, Sīdōnī
			const getPositiveMasculineSingularGenitiveForms = () => {
				const mappedStems = stems.map(stem => {
					const uncontracted = joinStemsToEndings(stem, 'ī');
					const contracted = stem.substring(0, stems[0].length - 1) + 'ī';
					const contractedWithAcute = contracted
						.replace(/a(?=[bcdfglmnprstv]ī$)/, 'á')
						.replace(/e(?=[bcdfglmnprstv]ī$)/, 'é')
						.replace(/i(?=[bcdfglmnprstv]ī$)/, 'í')
						.replace(/o(?=[bcdfglmnprstv]ī$)/, 'ó')
						.replace(/u(?=[bcdfglmnprstv]ī$)/, 'ú')
						.replace(/y(?=[bcdfglmnprstv]ī$)/, 'ý')
					if (stem.endsWith('i') || stem.endsWith("ï")) {
						return [uncontracted, [contracted, contractedWithAcute]];
					}
					return [uncontracted];
				});
				return [... new Set(mappedStems.flat(2))];
			}

			const allUnencliticizedForms = {
				positive: {
					masculine: {
						singular: {
							nominative: [lemma],
							vocative: joinStemsToEndings(stems, (stems[0].endsWith('a') ? 'ë' : 'e')),
							accusative: joinStemsToEndings(stems, 'um'),
							genitive: getPositiveMasculineSingularGenitiveForms(),
							dative: joinStemsToEndings(stems, 'ō'),
							ablative: joinStemsToEndings(stems, 'ō'),
						},
						plural: {
							nominative: joinStemsToEndings(stems, 'ī'),
							vocative: joinStemsToEndings(stems, 'ī'),
							accusative: joinStemsToEndings(stems, 'ōs'),
							genitive: joinStemsToEndings(stems, 'ōrum'),
							dative: joinStemsToEndings(stems, 'īs'),
							ablative: joinStemsToEndings(stems, 'īs'),
						},
					},
					feminine: {
						singular: {
							nominative: joinStemsToEndings(stems, 'a'),
							vocative: joinStemsToEndings(stems, 'a'),
							accusative: joinStemsToEndings(stems, 'am'),
							genitive: joinStemsToEndings(stems, 'ae'),
							dative: joinStemsToEndings(stems, 'ae'),
							ablative: joinStemsToEndings(stems, 'ā'),
						},
						plural: {
							nominative: joinStemsToEndings(stems, 'ae'),
							vocative: joinStemsToEndings(stems, 'ae'),
							accusative: joinStemsToEndings(stems, 'ās'),
							genitive: joinStemsToEndings(stems, 'ārum'),
							dative: joinStemsToEndings(stems, 'īs'),
							ablative: joinStemsToEndings(stems, 'īs'),
						},
					},
					neuter: {
						singular: {
							nominative: joinStemsToEndings(stems, 'um'),
							vocative: joinStemsToEndings(stems, 'um'),
							accusative: joinStemsToEndings(stems, 'um'),
							genitive: joinStemsToEndings(stems, 'ī'),
							dative: joinStemsToEndings(stems, 'ō'),
							ablative: joinStemsToEndings(stems, 'ō'),
						},
						plural: {
							nominative: joinStemsToEndings(stems, 'a'),
							vocative: joinStemsToEndings(stems, 'a'),
							accusative: joinStemsToEndings(stems, 'a'),
							genitive: joinStemsToEndings(stems, 'ōrum'),
							dative: joinStemsToEndings(stems, 'īs'),
							ablative: joinStemsToEndings(stems, 'īs'),
						},
					},
				},
				comparative: generateComparativeForms(comparativeStems),
				superlative: generateSuperlativeForms(superlativeStems),
			};
			return applyFieldsToForms(allUnencliticizedForms, rest);
		}
		//// 3rd-declension adjectives
		const stems = ensureIsArray((() => {
			if (rest.ObliqueStems) {
				return rest.ObliqueStems;
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
			if (lemma.endsWith('r')) {
				return lemma;
			}
			if (lemma.endsWith('as')) {
				return lemma.replace(/as$/, 'ad');
			}
			if (lemma.endsWith('x')) {
				return lemma.replace(/x$/, 'c');
			}
			return lemma.substring(0, lemma.length - 2);
		})());

		const hasIStem = (() => {
			if (rest.HasIStem === true || rest.HasIStem === false) {
				return rest.HasIStem;
			}
			if (lemma.endsWith('ilis')) { return true; }
			if (lemma.endsWith('īlis')) { return true; }
			if (lemma.endsWith('ālis')) { return true; }
			if (lemma.endsWith('ēlis')) { return true; }
			if (lemma.endsWith('ūlis')) { return true; }
			if (lemma.endsWith('ns')) { return true; }
			if (lemma.endsWith('ēnsis')) { return true; }
			if (lemma.endsWith('guis')) { return true; }
			if (lemma.endsWith('quis')) { return true; }
			if (stems[0].endsWith('r')) { return true; }
			if (lemma.endsWith('x')) { return true; }

			//// Let’s assume that Greek adjectives don’t have i-stem.
			//// (I don’t know!)
			if (rest.Transliterations) {
				return false;
			}
			//// Adjectives should have i-stem by default, unlike nouns.
			return true;
		})();

		const posAcPlNonNeuterForms = (() => {
			if (hasIStem) {
				return joinStemsToEndings(stems, ['ēs', 'īs']);
			}
			return joinStemsToEndings(stems, 'ēs');
		})();

		// console.log(`${lemma} ${hasIStem}`);
		const comparativeStems = rest.ComparativeStems || joinStemsToEndings(stems, 'i');
		const superlativeStems = rest.SuperlativeStems
		|| (lemma.endsWith('er')
			? joinStemsToEndings(lemma, 'rim')
			: joinStemsToEndings(stems, 'issim'));

		const allUnencliticizedForms = {
			positive: {
				masculine: {
					singular: {
						nominative: [lemma],
						vocative: [lemma],
						accusative: joinStemsToEndings(stems, 'em'),
						genitive: joinStemsToEndings(stems, 'is'),
						dative: joinStemsToEndings(stems, 'ī'),
						ablative: joinStemsToEndings(stems, (hasIStem ? 'ī' : 'e')),
					},
					plural: {
						nominative: joinStemsToEndings(stems, 'ēs'),
						vocative: joinStemsToEndings(stems, 'ēs'),
						accusative: posAcPlNonNeuterForms,
						genitive: joinStemsToEndings(stems, (hasIStem ? 'ium' : 'um')),
						dative: joinStemsToEndings(stems, 'ibus'),
						ablative: joinStemsToEndings(stems, 'ibus'),
					},
				},
				feminine: {
					singular: {
						nominative: [lemma],
						vocative: [lemma],
						accusative: joinStemsToEndings(stems, 'em'),
						genitive: joinStemsToEndings(stems, 'is'),
						dative: joinStemsToEndings(stems, 'ī'),
						ablative: joinStemsToEndings(stems, (hasIStem ? 'ī' : 'e')),
					},
					plural: {
						nominative: joinStemsToEndings(stems, 'ēs'),
						vocative: joinStemsToEndings(stems, 'ēs'),
						accusative: posAcPlNonNeuterForms,
						genitive: joinStemsToEndings(stems, (hasIStem ? 'ium' : 'um')),
						dative: joinStemsToEndings(stems, 'ibus'),
						ablative: joinStemsToEndings(stems, 'ibus'),
					},
				},
				neuter: {
					singular: {
						nominative: joinStemsToEndings(stems, 'e'),
						vocative: joinStemsToEndings(stems, 'e'),
						accusative: joinStemsToEndings(stems, 'e'),
						genitive: joinStemsToEndings(stems, 'is'),
						dative: joinStemsToEndings(stems, 'ī'),
						ablative: joinStemsToEndings(stems, (hasIStem ? 'ī' : 'e')),
					},
					plural: {
						nominative: joinStemsToEndings(stems, (hasIStem ? 'ia' : 'a')),
						vocative: joinStemsToEndings(stems, (hasIStem ? 'ia' : 'a')),
						accusative: joinStemsToEndings(stems, (hasIStem ? 'ia' : 'a')),
						genitive: joinStemsToEndings(stems, (hasIStem ? 'ium' : 'um')),
						dative: joinStemsToEndings(stems, 'ibus'),
						ablative: joinStemsToEndings(stems, 'ibus'),
					},
				},
			},
			comparative: generateComparativeForms(comparativeStems),
			superlative: generateSuperlativeForms(superlativeStems),
		};
		return applyFieldsToForms(allUnencliticizedForms, rest);
	},
	"Conjunction": ({Lemma, PartOfSpeech, ...rest}) => {
		if (Lemma.startsWith('-')) {
			return rest.Forms;
		}
		return [...new Set(rest.Forms ?? []).add(removeBrackets(Lemma))];
	},
	"Adverb": ({Lemma, PartOfSpeech, ...rest}) => {
		if (rest.Forms) {
			return multiplyWithEnclitics(rest.Forms);
		}
		const positive = removeBrackets(Lemma);
		const stems = rest.ObliqueStems || [positive.replace(/(ē|iter|(?<=c)ter|er|im|om|um|ō|e|ī)$/, "")];

		if (rest.IsIndeclinable
			|| positive === stems[0]
			|| (!rest.ObliqueStems && (positive.endsWith("ātim") || positive.endsWith("ūtim")))
		) {
			if (rest.IsIndeclinable) {
				// For adverbs, `IsIndeclinable: true` is a less correct property than `ParsingsToExclude: ["comparative", "superlative"]`
				// although the two properties are treated the same.
				console.warn(`Adverb marked as indeclinable: ${Lemma}`);
			}
			return multiplyWithEnclitics({positive: [positive]});
		}

		const comparatives = stems.map(stem => stem + "ius");
		const superlatives = stems.map(stem => (/[bce]r$/.test(stem) ? stem.replace(/e?r$/, "errimē") : stem + "issimē"));
		const allForms = {
			positive: [positive],
			comparative: comparatives,
			superlative: superlatives
		};
		const withReplacements = replaceFieldsInObjects(allForms, rest.ReplacementForms)
		const withEnclitics = multiplyWithEnclitics(withReplacements);
		const withQueLemmaHandled = markQueAsUnencliticized(withEnclitics, rest.IsLemmaInQue)
		const wantedForms = deleteUnwantedForms(withQueLemmaHandled, rest.ParsingsToExclude);
		return wantedForms;
	},
	"Interjection": ({Lemma, PartOfSpeech, ...rest}) => {
		if (rest.Forms) {
			return rest.Forms;
		}
		return [removeBrackets(Lemma)];
	},
	"Noun": ({Lemma, PartOfSpeech, ...rest}) => {
		const lemma = removeBrackets(Lemma);
		const declensions = (() => {
			if (rest.Declensions) {
				return rest.Declensions;
			}
			if (rest.IsIndeclinable) {
				return [];
			}
			if (Lemma.endsWith("ōrum]")) {
				console.log(`Assuming 2nd declension for ${Lemma}`)
				return [2];
			}
			if (lemma.endsWith("a")) {
				console.log(`Assuming 1st declension for ${Lemma}`)
				return [1];
			}
			if (lemma.endsWith("ē")) {
				console.log(`Assuming 1st declension for ${Lemma}`)
				return [1];
			}
			if (lemma.endsWith("ae")) {
				console.log(`Assuming 1st declension for ${Lemma}`)
				return [1];
			}
			if (
				(lemma.endsWith("us"))
				|| (lemma.endsWith("üs"))
				|| (lemma.endsWith("er"))
				|| (lemma.endsWith("um"))
				|| (lemma.endsWith("os"))
				|| (lemma.endsWith("ī"))
			) {
				// console.log('Assuming 2nd declension for ' + Lemma);
				return [2];
			}
			if (lemma.endsWith("ū")) {
				console.log('Assuming 4th declension for ' + Lemma);
				return [4];
			}
			return [3];
		})();
		const genders = (() => {
			if (rest.Genders) { return rest.Genders; }

			console.log('Genders not specified for ' + Lemma)

			if (rest.Notes) {
				if (rest.Notes.includes("masculine") && rest.Notes.includes("feminine") && rest.Notes.includes("neuter")) {
					console.log(`Assuming masculine & feminine & neuter for ${Lemma}: ${rest.Notes}`)
					return ["masculine", "feminine", "neuter"];
				}
				if (rest.Notes.includes("masculine") && rest.Notes.includes("feminine")) {
					console.log(`Assuming masculine & feminine for ${Lemma}: ${rest.Notes}`)
					return ["masculine", "feminine"];
				}
				if (rest.Notes.includes("masculine") && rest.Notes.includes("neuter")) {
					console.log(`Assuming masculine & neuter for ${Lemma}: ${rest.Notes}`)
					return ["masculine", "neuter"];
				}
				if (rest.Notes.includes("masculine")) {
					console.log(`Assuming masculine for ${Lemma}: ${rest.Notes}`)
					return ["masculine"];
				}
				if (rest.Notes.includes("feminine")) {
					console.log(`Assuming feminine for ${Lemma}: ${rest.Notes}`)
					return ["feminine"];
				}
				if (rest.Notes.includes("neuter")) {
					console.log(`Assuming neuter for ${Lemma}: ${rest.Notes}`)
					return ["neuter"];
				}
			}

			if (declensions.includes(1)) {
				console.log(`Assuming feminine for ${Lemma}`)
				return ["feminine"];
			}
			if (declensions.includes(2)) {
				if (lemma.endsWith('um') || lemma.endsWith('on')) {
					console.log(`Assuming neuter for ${Lemma}`)
					return ["neuter"];
				}
				console.log(`Assuming masculine for ${Lemma}`)
				return ["masculine"];
			}
			if (lemma.endsWith('ōn')) {
				console.log(`Assuming masculine for ${Lemma}`)
				return ["masculine"]
			}
			if (lemma.endsWith('on')) {
				console.log(`Assuming neuter for ${Lemma}`)
				return ["neuter"]
			}
			if (lemma.endsWith('ē')) {
				console.log(`Assuming feminine for ${Lemma}`)
				return ["feminine"]
			}
			if (lemma.endsWith('iō')) {
				console.log(`Assuming feminine for ${Lemma}`)
				return ["feminine"]
			}
			if (lemma.endsWith('tūdō')) {
				console.log(`Assuming feminine for ${Lemma}`)
				return ["feminine"]
			}
			if (lemma.endsWith('ās')) {
				console.log(`Assuming feminine for ${Lemma}`)
				return ["feminine"]
			}
			if (lemma.endsWith('ae')) {
				console.log(`Assuming feminine for ${Lemma}`)
				return ["feminine"]
			}
			if (lemma.endsWith('or')) {
				console.log(`Assuming masculine for ${Lemma}`)
				return ["masculine"]
			}
			if (lemma.endsWith('x')) {
				console.log(`Assuming feminine for ${Lemma}`)
				return ["feminine"]
			}
			if (lemma.endsWith('l')) {
				console.log(`Assuming neuter for ${Lemma}`)
				return ["neuter"]
			}
			if (lemma.endsWith('le')) {
				console.log(`Assuming neuter for ${Lemma}`)
				return ["neuter"]
			}
			if (lemma.endsWith('os')) {
				console.log(`Assuming masculine for ${Lemma}`)
				return ["masculine"]
			}
			if (lemma.endsWith('ōs')) {
				console.log(`Assuming masculine for ${Lemma}`)
				return ["masculine"]
			}
			if (lemma.endsWith('ar')) {
				console.log(`Assuming neuter for ${Lemma}`)
				return ["neuter"]
			}
			console.warn(`Could not determine genders for ${Lemma}`);
			return [];
		})();

		if (rest.Forms) {
			return multiplyWithEnclitics(rest.Forms);
		}

		let forms = {};
		const hasLocativePlural = rest.HasLocative && rest.ParsingsToExclude?.includes("singular");
		const hasLocativeSingular = rest.HasLocative && !hasLocativePlural;

		if (rest.IsIndeclinable) {
			if (rest.Declensions) {
				console.warn('Both IsIndeclinable and Declensions are truthy for: ' + Lemma);
			}

			genders.forEach(gender => {
				forms[gender] = ({
					singular: {
						nominative: [lemma],
						vocative: [lemma],
						accusative: [lemma],
						genitive: [lemma],
						dative: [lemma],
						ablative: [lemma],
						locative: (hasLocativeSingular ? [lemma] : [])
					}
				});
			});
		}



		const assumedStem = (() => {

			const getAssumedStem = (tuples) => {
				for (let tuple of tuples) {
					const [regex, ending] = tuple;
					if (regex.test(lemma)) {
						return lemma.replace(regex, ending);
					}
				}
				return lemma;
			}

			const thirdDeclLemmaSuffixesAndOblique = [
				[/al$/, 'āl'],
				[/ar$/, 'ār'],
				[/āns$/, 'ant'],
				[/as$/, 'ad'],
				[/ās$/, 'āt'],
				[/(?<=[bp])s$/, ''],
				[/e$/, ''],
				[/en$/, 'in'],
				[/ēns$/, 'ent'],
				[/(?<!a)es$/, 'it'],
				[/ēs$/, ''],
				[/(?<!a)ex$/, 'ic'],
				[/x$/, 'c'],
				[/ia$/, ''],
				[/a$/, ''],
				[/īgō$/, 'īgin'],
				[/is$/, ''],
				[/ēdō$/, 'ēdin'],
				[/tūdō$/, 'tūdin'],
				[/ō$/, 'ōn'],
				[/ōn$/, 'on'],
				[/ōns$/, 'ont'],
				[/or$/, 'ōr'],
				[/ōs$/, 'ōt'],
				[/ys$/, 'y'],
			];
			const nonThirdDeclLemmaSuffixesAndOblique = [
				[/a$/, ''],
				[/ae$/, ''],
				[/ās$/, ''],
				[/ē$/, ''],
				[/ēs$/, ''],
				[/ī$/, ''],
				[/ō$/, ''],
				[/on$/, ''],
				[/os$/, ''],
				[/um$/, ''],
				[/us$/, ''],
				[/üs$/, ''],
				[/ū$/, ''],
				[/ūs$/, ''],
			];

			if (declensions.includes(3)) {
				return getAssumedStem(thirdDeclLemmaSuffixesAndOblique);
			}
			else {
				return getAssumedStem(nonThirdDeclLemmaSuffixesAndOblique);
			}
		})()

		const stems = rest.ObliqueStems ?? [assumedStem];

		const hasIStem = (() => {
			if (rest.HasIStem === true || rest.HasIStem === false) {
				return rest.HasIStem;
			}
			if (!declensions.includes(3)) {
				return false;
			}
			if (rest.ObliqueStems) {
				return false;
			}
			if (lemma.endsWith('ēnsis')) {
				return true;
			}
			if (lemma.endsWith('ns')) {
				return true;
			}
			if (lemma.endsWith('ia')) {
				return true;
			}
			if (lemma.endsWith('is')) {
				return true;
			}
			if (lemma.endsWith('al')) {
				return true;
			}
			if (lemma.endsWith('ar')) {
				return true;
			}
			if (lemma.endsWith('e')) {
				return true;
			}

			//// Parisyllabic nouns probably have i-stem, but this should be confirmed.
			//// Pluralia tantum cannot be deemed parisyllabic because there’s no nominative singular.
			//// Singularia tantum have no plural forms that could be affected by the i-stem.
			const hasBothSingularAndPlural =
				!rest.ParsingsToExclude?.includes('singular') &&
				!rest.ParsingsToExclude?.includes('plural');

			const isParisyllabic = hasBothSingularAndPlural && stems.some(stem => {
				return lemma === stem + 'is' || lemma === stem + 'ēs';
			});

			if (isParisyllabic) {
				console.warn('Assuming HasIStem === true for ' + Lemma);
				return true;
			}

			return false;
		})()

		const getThirdDeclensionNonNeuterForms = () => {
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: joinStemsToEndings(stems, 'em'),
					genitive: joinStemsToEndings(stems, 'is'),
					dative: joinStemsToEndings(stems, 'ī'),
					ablative: joinStemsToEndings(stems, rest.IsDeclinedLikeAdjective ? 'ī' : 'e'),
					locative: (hasLocativeSingular ? joinStemsToEndings(stems, 'ī') : []),
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ēs'),
					vocative: joinStemsToEndings(stems, 'ēs'),
					accusative: joinStemsToEndings(stems, (hasIStem ? ['ēs', 'īs'] : 'ēs')),
					genitive: joinStemsToEndings(stems, (hasIStem || rest.IsDeclinedLikeAdjective ? 'ium' : 'um')),
					dative: joinStemsToEndings(stems, 'ibus'),
					ablative: joinStemsToEndings(stems, 'ibus'),
					locative: (hasLocativePlural ? joinStemsToEndings(stems, 'ibus') : []),
				},
			}
		}
		const getThirdDeclensionNeuterForms = () => {
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: joinStemsToEndings(stems, 'e'),
					genitive: joinStemsToEndings(stems, 'is'),
					dative: joinStemsToEndings(stems, 'ī'),
					ablative: joinStemsToEndings(stems, (hasIStem ? 'ī' : 'e')),
					locative: (hasLocativeSingular ? joinStemsToEndings(stems, 'ī') : []),
				},
				plural: {
					nominative: joinStemsToEndings(stems, (hasIStem ? 'ia' : 'a')),
					vocative: joinStemsToEndings(stems, (hasIStem ? 'ia' : 'a')),
					accusative: joinStemsToEndings(stems, (hasIStem ? 'ia' : 'a')),
					genitive: joinStemsToEndings(stems, (hasIStem ? 'ium' : 'um')),
					dative: joinStemsToEndings(stems, 'ibus'),
					ablative: joinStemsToEndings(stems, 'ibus'),
					locative: (hasLocativePlural ? joinStemsToEndings(stems, 'ibus') : []),
				},
			};
		}
		const getFirstDeclensionNonNeuterForms = () => {
			const isGreekFirstDeclension = (() => {
				if (rest.IsGreekFirstDeclension === true || rest.IsGreekFirstDeclension === false) {
					return rest.IsGreekFirstDeclension;
				}
				return lemma.endsWith('ās') || lemma.endsWith('ē');
			})();
			const isGreekFirstDeclensionA = isGreekFirstDeclension && lemma.endsWith('ās');
			const isGreekFirstDeclensionE = isGreekFirstDeclension && !lemma.endsWith('ās');
			const accSingEnding = isGreekFirstDeclensionE
				? 'ēn'
				: isGreekFirstDeclensionA
					? 'ān'
					: 'am';
			const genSingEnding = isGreekFirstDeclensionE ? 'ēs' : 'ae';
			const ablSingEnding = isGreekFirstDeclensionE ? 'ē' : 'ā';
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: joinStemsToEndings(stems, accSingEnding),
					genitive: joinStemsToEndings(stems, genSingEnding),
					dative: joinStemsToEndings(stems, 'ae'),
					ablative: joinStemsToEndings(stems, ablSingEnding),
					locative: (hasLocativeSingular ? joinStemsToEndings(stems, 'ae') : []),
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ae'),
					vocative: joinStemsToEndings(stems, 'ae'),
					accusative: joinStemsToEndings(stems, 'ās'),
					genitive: joinStemsToEndings(stems, 'ārum'),
					dative: joinStemsToEndings(stems, 'īs'),
					ablative: joinStemsToEndings(stems, 'īs'),
					locative: (hasLocativePlural ? joinStemsToEndings(stems, 'īs') : []),
				},
			};
		}
		const getSecondDeclensionNonNeuterForms = () => {
			//// Note on vocatives for -ius nouns:
			//// Proper nouns that end in -ius (& fīlius, genius) should have vocative masculine singular in -ī.
			//// (Exceptions include some Greek names that have vocative masculine singular in iota epsilon in Greek.)
			//// Adjectives, and all other nouns, should have vocative masculine singular in -ie.
			//// (However, before imperial times, -ie forms were avoided, and sometimes -ī forms were used instead.)
			//// Source: https://ore.exeter.ac.uk/repository/bitstream/handle/10036/65307/DickeyOEgregie.pdf
			const nonProperNounVocSings = joinStemsToEndings(stems, 'e')
				.map(form => form.replace(/ae$/, 'aë').replace(/oe$/, 'oë'));
			const vocSings = PartOfSpeech === "Proper noun"
				? nonProperNounVocSings.map(form => form.replace(/[iï]e$/, 'ī'))
				: nonProperNounVocSings;

			const regularGenSings = joinStemsToEndings(stems, 'ī');
			const genSings = regularGenSings.flatMap(form => {
				if (form.endsWith('iī') || form.endsWith('ïī')) {
					return [form, form.replace(/[iï]ī$/, 'ī')];
				}
				return [form];
			});

			return {
				singular: {
					nominative: [lemma],
					vocative: vocSings,
					accusative: joinStemsToEndings(stems, 'um'),
					genitive: genSings,
					dative: joinStemsToEndings(stems, 'ō'),
					ablative: joinStemsToEndings(stems, 'ō'),
					locative: (hasLocativeSingular ? joinStemsToEndings(stems, 'ī') : []),
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ī'),
					vocative: joinStemsToEndings(stems, 'ī'),
					accusative: joinStemsToEndings(stems, 'ōs'),
					genitive: joinStemsToEndings(stems, 'ōrum'),
					dative: joinStemsToEndings(stems, 'īs'),
					ablative: joinStemsToEndings(stems, 'īs'),
					locative: (hasLocativePlural ? joinStemsToEndings(stems, 'īs') : []),
				},
			};
		}
		const getSecondDeclensionNeuterForms = () => {
			const regularGenSings = joinStemsToEndings(stems, 'ī');
			const genSings = regularGenSings.flatMap(form => {
				if (form.endsWith('iī')) {
					return [form, form.replace(/iī$/, 'ī')];
				}
				return [form];
			});
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: [lemma],
					genitive: genSings,
					dative: joinStemsToEndings(stems, 'ō'),
					ablative: joinStemsToEndings(stems, 'ō'),
					locative: (hasLocativeSingular ? joinStemsToEndings(stems, 'ī') : []),
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'a'),
					vocative: joinStemsToEndings(stems, 'a'),
					accusative: joinStemsToEndings(stems, 'a'),
					genitive: joinStemsToEndings(stems, 'ōrum'),
					dative: joinStemsToEndings(stems, 'īs'),
					ablative: joinStemsToEndings(stems, 'īs'),
					locative: (hasLocativePlural ? joinStemsToEndings(stems, 'īs') : []),
				},
			};
		}
		const getFourthDeclensionNonNeuterForms = () => {
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: joinStemsToEndings(stems, 'um'),
					genitive: joinStemsToEndings(stems, 'ūs'),
					dative: joinStemsToEndings(stems, 'uī'),
					ablative: joinStemsToEndings(stems, 'ū'),
					locative: (hasLocativeSingular ? joinStemsToEndings(stems, 'uī') : []),
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ūs'),
					vocative: joinStemsToEndings(stems, 'ūs'),
					accusative: joinStemsToEndings(stems, 'ūs'),
					genitive: joinStemsToEndings(stems, 'uum'),
					dative: joinStemsToEndings(stems, 'ibus'),
					ablative: joinStemsToEndings(stems, 'ibus'),
					locative: (hasLocativePlural ? joinStemsToEndings(stems, 'ibus') : []),
				},
			};
		}
		const getFourthDeclensionNeuterForms = () => {
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: [lemma],
					genitive: joinStemsToEndings(stems, 'ūs'),
					dative: joinStemsToEndings(stems, 'ū'),
					ablative: joinStemsToEndings(stems, 'ū'),
					locative: (hasLocativeSingular ? joinStemsToEndings(stems, 'ū') : [])
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ua'),
					vocative: joinStemsToEndings(stems, 'ua'),
					accusative: joinStemsToEndings(stems, 'ua'),
					genitive: joinStemsToEndings(stems, 'uum'),
					dative: joinStemsToEndings(stems, 'ibus'),
					ablative: joinStemsToEndings(stems, 'ibus'),
					locative: (hasLocativePlural ? joinStemsToEndings(stems, 'ibus') : []),
				},
			};
		}
		const getFifthDeclensionNonNeuterForms = () => {
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: joinStemsToEndings(stems, 'em'),
					genitive: joinStemsToEndings(stems, 'ēī'),
					dative: joinStemsToEndings(stems, 'ēī'),
					ablative: joinStemsToEndings(stems, 'ē'),
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ēs'),
					vocative: joinStemsToEndings(stems, 'ēs'),
					accusative: joinStemsToEndings(stems, 'ēs'),
					genitive: joinStemsToEndings(stems, 'ērum'),
					dative: joinStemsToEndings(stems, 'ēbus'),
					ablative: joinStemsToEndings(stems, 'ēbus'),
				},
			};
		}

		if (declensions.includes(3)) {
			const thirdDeclForms = {};
			["masculine", "feminine"].map(gender => {
				if (genders.includes(gender)) {
					thirdDeclForms[gender] = getThirdDeclensionNonNeuterForms();
				}
			});
			["neuter"].map(gender => {
				if (genders.includes(gender)) {
					thirdDeclForms[gender] = getThirdDeclensionNeuterForms();
				}
			});
			forms = mergeObjects(forms, thirdDeclForms);
		}
		if (declensions.includes(1)) {
			const firstDeclForms = {};
			["masculine", "feminine"].map(gender => {
				if (genders.includes(gender)) {
					firstDeclForms[gender] = getFirstDeclensionNonNeuterForms();
				}
			});
			["neuter"].map(gender => {
				if (genders.includes(gender)) {
					console.warn('I don’t know how to handle this 1st-declension neuter noun: ' + Lemma)
				}
			});
			forms = mergeObjects(forms, firstDeclForms);
		}
		if (declensions.includes(2)) {
			const secondDeclForms = {};
			["masculine", "feminine"].map(gender => {
				if (genders.includes(gender)) {
					secondDeclForms[gender] = getSecondDeclensionNonNeuterForms();
				}
			});
			["neuter"].map(gender => {
				if (genders.includes(gender)) {
					secondDeclForms[gender] = getSecondDeclensionNeuterForms();
				}
			});
			forms = mergeObjects(forms, secondDeclForms);
		}
		if (declensions.includes(4)) {
			const fourthDeclForms = {};
			["masculine", "feminine"].map(gender => {
				if (genders.includes(gender)) {
					fourthDeclForms[gender] = getFourthDeclensionNonNeuterForms();
				}
			});
			["neuter"].map(gender => {
				if (genders.includes(gender)) {
					fourthDeclForms[gender] = getFourthDeclensionNeuterForms();
				}
			});
			forms = mergeObjects(forms, fourthDeclForms);
		}
		if (declensions.includes(5)) {
			const fifthDeclForms = {};
			["masculine", "feminine"].map(gender => {
				if (genders.includes(gender)) {
					fifthDeclForms[gender] = getFifthDeclensionNonNeuterForms();
				}
			});
			["neuter"].map(gender => {
				if (genders.includes(gender)) {
					console.warn('I don’t know how to handle this 5th-declension neuter noun: ' + Lemma)
				}
			});
			forms = mergeObjects(forms, fifthDeclForms);
		}

		if (JSON.stringify(forms)==='{}') {
			console.warn("No forms for " + Lemma)
			return {}
		}

		return applyFieldsToForms(forms, rest);
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
		// Pronouns are hardcoded, so there’s not much for the Inflector to do.
		const lemma = removeBrackets(Lemma);
		if (!rest.Forms) {
			console.warn(`Forms not defined for pronoun ${Lemma}`)
			return multiplyWithEnclitics({lemma: [lemma]})
		}
		const wantedForms = deleteUnwantedForms(rest.Forms, rest.ParsingsToExclude);
		if (!wantedForms.unencliticized && (
			lemma.endsWith('libet')
			|| lemma.endsWith('met')
			|| lemma.endsWith('nam')
			|| lemma.endsWith('piam')
			|| lemma.endsWith('que')
			|| lemma.endsWith('vīs'))
		) {
			console.warn(`Enclitics have not been disabled for ${lemma}`)
		}
		const multiplied = multiplyWithEnclitics(wantedForms, true);
		return multiplied;
	},
	"Proper noun": ({Lemma, PartOfSpeech, ...rest}) => {

		//// Proper nouns referring to a town or small(ish) island should have a locative form.
		if (!rest.HasLocative && (rest.HasLocative !== false) && /city|town|village|seaport|\bport\b|(?<!whose )capital|(?<!large )island\b|isle/i.test(rest.Meanings)) {
			// console.log("Perhaps a locative should be given for " + Lemma + ": " + rest.Meanings);
			console.log("Perhaps a locative should be given for " + Lemma);
		}

		//// Proper nouns are declined much the same as other nouns.
		//// (They differ in their vocative singular if they end in “-ius”,
		//// but this is handled inside the Noun function.)
		return inflectFuncs["Noun"]({ Lemma, PartOfSpeech, ...rest });
	},
	"Verb": ({Lemma, PartOfSpeech, ...rest}) => {
		const lemma = removeBrackets(Lemma);
		let forms = {};

		if (rest.Forms) {
			forms = rest.Forms;
		}

		else {
			if (!rest.Conjugations || !rest.Conjugations.length) {
				console.warn('No Conjugations given for ' + Lemma)
			}

			if (rest.Conjugations?.includes("sum")) {
			const prefix = lemma.replace(/sum$/, '');
			forms = {
				indicative: {
					active: {
						present: {
							singular: {
								first: ['sum'],
								second: ['es'],
								third: ['est'],
							},
							plural: {
								first: ['sumus'],
								second: ['estis'],
								third: ['sunt'],
							},
						},
						imperfect: {
							singular: {
								first: ['eram'],
								second: ['erās'],
								third: ['erat'],
							},
							plural: {
								first: ['erāmus'],
								second: ['erātis'],
								third: ['erant'],
							},
						},
						future: {
							singular: {
								first: ['erō'],
								second: ['eris', 'ere'],
								third: ['erit'],
							},
							plural: {
								first: ['erimus'],
								second: ['eritis'],
								third: ['erunt'],
							},
						},
						perfect: {
							singular: {
								first: ['fuī'],
								second: ['fuistī'],
								third: ['fuit'],
							},
							plural: {
								first: ['fuimus'],
								second: ['fuistis'],
								third: ['fuērunt', 'fuēre'],
							},
						},
						pluperfect: {
							singular: {
								first: ['fueram'],
								second: ['fuerās'],
								third: ['fuerat'],
							},
							plural: {
								first: ['fuerāmus'],
								second: ['fuerātis'],
								third: ['fuerant'],
							},
						},
						futureperfect: {
							singular: {
								first: ['fuerō'],
								second: ['fueris'],
								third: ['fuerit'],
							},
							plural: {
								first: ['fuerimus'],
								second: ['fueritis'],
								third: ['fuerint'],
							},
						},
					},
				},
				subjunctive: {
					active: {
						present: {
							singular: {
								first: ['sim'],
								second: ['sīs'],
								third: ['sit'],
							},
							plural: {
								first: ['sīmus'],
								second: ['sītis'],
								third: ['sint'],
							},
						},
						imperfect: {
							singular: {
								first: ['essem', 'forem'],
								second: ['essēs', 'forēs'],
								third: ['esset', 'foret'],
							},
							plural: {
								first: ['essēmus', 'forēmus'],
								second: ['essētis', 'forētis'],
								third: ['essent', 'forent'],
							},
						},
						perfect: {
							singular: {
								first: ['fuerim'],
								second: ['fuerīs'],
								third: ['fuerit'],
							},
							plural: {
								first: ['fuerīmus'],
								second: ['fuerītis'],
								third: ['fuerint'],
							},
						},
						pluperfect: {
							singular: {
								first: ['fuissem'],
								second: ['fuissēs'],
								third: ['fuisset'],
							},
							plural: {
								first: ['fuissēmus'],
								second: ['fuissētis'],
								third: ['fuissent'],
							},
						},
					},},
				imperative: {
					active: {
						present: {
							singular: {
								second: ['es'],
							},
							plural: {
								second: ['este'],
							},
						},
						future: {
							singular: {
								second: ['estō'],
								third: ['estō'],
							},
							plural: {
								second: ['estōte'],
								third: ['suntō'],
							},
						},
					},
				},
				infinitive: {
					active: {
						present: ['esse'],
						perfect: ['fuisse'],
						future: ['fore'],
					}
				},
				participle: {
					active: {
						future: inflectFuncs['Adjective']({ Lemma: 'futūrus' })
							.unencliticized
							.positive,
					},
				},
				incorrect: ['erint'],
			}

			// Attach the prefix to all the forms of ‘sum’.
			forms = runLambdaOnObject(
				forms,
				(form) => joinStemsToEndings(prefix, form)
					// Forms such as ‘posfore’ & ‘posfutūrum’ should not exist.
					.filter(form => !form.includes('posfor') && !form.includes('posfut'))
					// Some prefixes change depending on the next letter.
					.map(form => form.replace(/^īn(?![fs])/, 'in').replace(/^posess/, 'poss').replace(/^pose/, 'pote').replace(/^posfu/, 'potu').replace(/^prōe/, 'prōde'))
					// Both ‘abfore’ & ‘āfore’ etc are permissible.
					.flatMap(form => form.startsWith('abf') ? [form, form.replace(/^abf/, 'āf')] : form)
			);
		}

		else if (rest.Conjugations?.includes('ferō')) {
			const prefix = lemma.replace(/fer(ō|or|t)$/, '');
			forms = {
				indicative: {
					active: {
						present: {
							singular: {
								first: ['ferō'],
								second: ['fers'],
								third: ['fert'],
							},
							plural: {
								first: ['ferimus'],
								second: ['fertis'],
								third: ['ferunt'],
							},
						},
						imperfect: {
							singular: {
								first: ['ferēbam'],
								second: ['ferēbās'],
								third: ['ferēbat'],
							},
							plural: {
								first: ['ferēbāmus'],
								second: ['ferēbātis'],
								third: ['ferēbant'],
							},
						},
						future: {
							singular: {
								first: ['feram'],
								second: ['ferēs'],
								third: ['feret'],
							},
							plural: {
								first: ['ferēmus'],
								second: ['ferētis'],
								third: ['ferent'],
							},
						},
						perfect: {
							singular: {
								first: ['tulī'],
								second: ['tulistī'],
								third: ['tulit'],
							},
							plural: {
								first: ['tulimus'],
								second: ['tulistis'],
								third: ['tulērunt', 'tulēre'],
							},
						},
						pluperfect: {
							singular: {
								first: ['tuleram'],
								second: ['tulerās'],
								third: ['tulerat'],
							},
							plural: {
								first: ['tulerāmus'],
								second: ['tulerātis'],
								third: ['tulerant'],
							},
						},
						futureperfect: {
							singular: {
								first: ['tulerō'],
								second: ['tuleris'],
								third: ['tulerit'],
							},
							plural: {
								first: ['tulerimus'],
								second: ['tuleritis'],
								third: ['tulerint'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								first: ['feror'],
								second: ['ferris', 'ferre'],
								third: ['fertur'],
							},
							plural: {
								first: ['ferimur'],
								second: ['feriminī'],
								third: ['feruntur'],
							},
						},
						imperfect: {
							singular: {
								first: ['ferēbar'],
								second: ['ferēbāris', 'ferēbāre'],
								third: ['ferēbātur'],
							},
							plural: {
								first: ['ferēbāmur'],
								second: ['ferēbāminī'],
								third: ['ferēbantur'],
							},
						},
						future: {
							singular: {
								first: ['ferar'],
								second: ['ferēris', 'ferēre'],
								third: ['ferētur'],
							},
							plural: {
								first: ['ferēmur'],
								second: ['ferēminī'],
								third: ['ferentur'],
							},
						},
					},
				},
				subjunctive: {
					active: {
						present: {
							singular: {
								first: ['feram'],
								second: ['ferās'],
								third: ['ferat'],
							},
							plural: {
								first: ['ferāmus'],
								second: ['ferātis'],
								third: ['ferant'],
							},
						},
						imperfect: {
							singular: {
								first: ['ferrem'],
								second: ['ferrēs'],
								third: ['ferret'],
							},
							plural: {
								first: ['ferrēmus'],
								second: ['ferrētis'],
								third: ['ferrent'],
							},
						},
						perfect: {
							singular: {
								first: ['tulerim'],
								second: ['tulerīs'],
								third: ['tulerit'],
							},
							plural: {
								first: ['tulerīmus'],
								second: ['tulerītis'],
								third: ['tulerint'],
							},
						},
						pluperfect: {
							singular: {
								first: ['tulissem'],
								second: ['tulissēs'],
								third: ['tulisset'],
							},
							plural: {
								first: ['tulissēmus'],
								second: ['tulissētis'],
								third: ['tulissent'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								first: ['ferar'],
								second: ['ferāris', 'ferāre'],
								third: ['ferātur'],
							},
							plural: {
								first: ['ferāmur'],
								second: ['ferāminī'],
								third: ['ferantur'],
							},
						},
						imperfect: {
							singular: {
								first: ['ferrer'],
								second: ['ferrēris', 'ferrēre'],
								third: ['ferrētur'],
							},
							plural: {
								first: ['ferrēmur'],
								second: ['ferrēminī'],
								third: ['ferrentur'],
							},
						},
					},
				},
				imperative: {
					active: {
						present: {
							singular: {
								second: ['fer'],
							},
							plural: {
								second: ['ferte'],
							},
						},
						future: {
							singular: {
								second: ['fertō'],
								third: ['fertō'],
							},
							plural: {
								second: ['fertōte'],
								third: ['feruntō'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								second: ['ferre'],
							},
							plural: {
								second: ['feriminī'],
							},
						},
						future: {
							singular: {
								second: ['fertor'],
								third: ['fertor'],
							},
							plural: {
								third: ['feruntor'],
							},
						},
					},
				},
				infinitive: {
					active: {
						present: ['ferre'],
						perfect: ['tulisse'],
					},
					passive: {
						present: ['ferrī', 'ferrier']
					}
				},
				participle: {
					active: {
						present: inflectFuncs['Adjective']({ Lemma: 'ferēns' })
							.unencliticized
							.positive,
						future: inflectFuncs['Adjective']({ Lemma: 'lātūrus' })
							.unencliticized
							.positive,
					},
					passive: {
						past: inflectFuncs['Adjective']({ Lemma: 'lātus' })
							.unencliticized
							.positive,
						future: inflectFuncs['Adjective']({ Lemma: 'ferendus' })
							.unencliticized
							.positive,
					},
				},
				gerund: inflectFuncs['Adjective']({
					Lemma: 'ferendus',
					ParsingsToExclude: ["nominative", "vocative"],
				})
					.unencliticized
					.positive
					.neuter
					.singular,
				supine: {
					accusative: ['lātum'],
					ablative: ['lātū'],
				}
			}

			// Attach the prefix to all the forms of ferō.
			forms = runLambdaOnObject(
				forms,
				(form) => joinStemsToEndings(prefix, form)
					// Some prefixes change depending on the next letter.
					.map(form => form
						.replace(/^af(?=[l])/, 'al')
						.replace(/^af(?=[t])/, 'at')
						.replace(/^au(?=[l])/, 'ab')
						.replace(/^au(?=[t])/, 'abs')
						.replace(/^cōn(?=[lt])/, 'con')
						.replace(/^dif(?=[l])/, 'dī')
						.replace(/^dif(?=[t])/, 'dis')
						.replace(/^dis(?=[l])/, 'dī')
						.replace(/^ef(?=[l])/, 'ē')
						.replace(/^ef(?=[t])/, 'ex')
						.replace(/^īn(?=[lt])/, 'in')
						.replace(/^suf(?=[t])/, 'sus')
						.replace(/^of(?=[lt])/, 'ob')
						.replace(/^suf(?=[l])/, 'sub')
						.replace(/^suf(?=[t])/, 'sus')
					)
					// // Both ‘trālātus’ & ‘trānslātus’ etc are permissible.
					.flatMap(form => form.startsWith('trānsl') ? [form, form.replace(/^trānsl/, 'trāl')] : form)
					.flatMap(form => form.startsWith('conl') ? [form, form.replace(/^con/, 'col')] : form)
					.flatMap(form => form.startsWith('ret') ? [form, form.replace(/^ret/, 'rett')] : form)
					.flatMap(form => form.startsWith('tul') ? [form, form.replace(/^tul/, 'tetul')] : form)
			);
		}

		else if (rest.Conjugations?.includes("eō")) {
			const prefix = lemma.replace(/[eë]ō$/, '');
			forms = {
				indicative: {
					active: {
						present: {
							singular: {
								first: ['eō'],
								second: ['īs'],
								third: ['it'],
							},
							plural: {
								first: ['īmus'],
								second: ['ītis'],
								third: ['eunt'],
							},
						},
						imperfect: {
							singular: {
								first: ['ībam'],
								second: ['ībās'],
								third: ['ībat'],
							},
							plural: {
								first: ['ībāmus'],
								second: ['ībātis'],
								third: ['ībant'],
							},
						},
						future: {
							singular: {
								first: ['ībō'],
								second: ['ībis'],
								third: ['ībit'],
							},
							plural: {
								first: ['ībimus'],
								second: ['ībitis'],
								third: ['ībunt'],
							},
						},
						perfect: {
							singular: {
								first: ['īvī', 'iī'],
								second: ['īvistī', 'iistī', 'īstī'],
								third: ['īvit', 'iit'],
							},
							plural: {
								first: ['iimus'],
								second: ['iistis', 'īstis'],
								third: ['iērunt', 'iēre'],
							},
						},
						pluperfect: {
							singular: {
								first: ['ieram'],
								second: ['ierās'],
								third: ['ierat'],
							},
							plural: {
								first: ['ierāmus'],
								second: ['ierātis'],
								third: ['ierant'],
							},
						},
						futureperfect: {
							singular: {
								first: ['ierō'],
								second: ['ieris'],
								third: ['ierit'],
							},
							plural: {
								first: ['ierimus'],
								second: ['ieritis'],
								third: ['ierint'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								third: ['ītur']
							},
						},
						imperfect: {
							singular: {
								third: ['ībātur']
							},
						},
						future: {
							singular: {
								third: ['ībitur']
							},
						},
					},
				},
				subjunctive: {
					active: {
						present: {
							singular: {
								first: ['eam'],
								second: ['eās'],
								third: ['eat'],
							},
							plural: {
								first: ['eāmus'],
								second: ['eātis'],
								third: ['eant'],
							},
						},
						imperfect: {
							singular: {
								first: ['īrem'],
								second: ['īrēs'],
								third: ['īret'],
							},
							plural: {
								first: ['īrēmus'],
								second: ['īrētis'],
								third: ['īrent'],
							},
						},
						perfect: {
							singular: {
								first: ['ierim'],
								second: ['ierīs'],
								third: ['ierit'],
							},
							plural: {
								first: ['ierīmus'],
								second: ['ierītis'],
								third: ['ierint'],
							},
						},
						pluperfect: {
							singular: {
								first: ['īssem'],
								second: ['īssēs'],
								third: ['īsset'],
							},
							plural: {
								first: ['īssēmus'],
								second: ['īssētis'],
								third: ['īssent'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								third: ['eātur']
							},
						},
						imperfect: {
							singular: {
								third: ['īrētur']
							},
						},
					},
				},
				imperative: {
					active: {
						present: {
							singular: {
								second: ['ī'],
							},
							plural: {
								second: ['īte'],
							},
						},
						future: {
							singular: {
								second: ['ītō'],
								third: ['ītō'],
							},
							plural: {
								second: ['ītōte'],
								third: ['euntō'],
							},
						},
					},
				},
				infinitive: {
					active: {
						present: ['īre'],
						perfect: ['īsse'],
					},
					passive: {
						present: ['īrī', 'īrier']
					}
				},
				participle: {
					active: {
						present: inflectFuncs['Adjective']({ Lemma: 'iēns' })
							.unencliticized
							.positive,
						future: inflectFuncs['Adjective']({ Lemma: 'itūrus' })
							.unencliticized
							.positive,
					},
					passive: {
						future: inflectFuncs['Adjective']({ Lemma: 'eundus' })
							.unencliticized
							.positive,
					}
				},
				supine: {
					accusative: ['itum'],
					ablative: ['itū'],
				}
			}

			const transitiveForms = {
				indicative: {
					passive: {
						present: {
							singular: {
								first: ['eor'],
								second: ['īris', 'īre'],
							},
							plural: {
								first: ['īmur'],
								second: ['īminī'],
								third: ['euntur']
							},
						},
						imperfect: {
							singular: {
								first: ['ībar'],
								second: ['ībāris', 'ībāre'],
							},
							plural: {
								first: ['ībāmur'],
								second: ['ībāminī'],
								third: ['ībantur']
							},
						},
						future: {
							singular: {
								first: ['ībor'],
								second: ['īberis', 'ībere'],
							},
							plural: {
								first: ['ībimur'],
								second: ['ībiminī'],
								third: ['ībuntur']
							},
						},
					},
				},
				subjunctive: {
					passive: {
						present: {
							singular: {
								first: ['ear'],
								second: ['eāris', 'eāre'],
							},
							plural: {
								first: ['eāmur'],
								second: ['eāminī'],
								third: ['eantur']
							},
						},
						imperfect: {
							singular: {
								first: ['īrer'],
								second: ['īrēris', 'īrēre'],
							},
							plural: {
								first: ['īrēmur'],
								second: ['īrēminī'],
								third: ['īrentur']
							},
						},
					},
				},
				imperative: {
					passive: {
						present: {
							singular: {
								second: ['īre']
							},
							plural: {
								second: ['īminī']
							}
						},
						future: {
							singular: {
								second: ["ītor"],
								third: ["ītor"],
							},
							plural: {
								third: ["euntor"]
							}
						}
					},
				},
				participle: {
					passive: {
						past: inflectFuncs['Adjective']({ Lemma: 'itus' })
							.unencliticized
							.positive,
					}
				}
			}

			if (rest.IsIntransitive === false) {
				forms = mergeObjects(forms, transitiveForms);
			}

			// Attach the prefix to all the forms of ‘eō’.
			forms = runLambdaOnObject(
				forms,
				(form) => joinStemsToEndings(prefix, form)
					// Correct the oblique stem of present active participles.
					.map(form => form.replace(/oient/, 'oëunt').replace(/ient/, 'eunt'))
					// Forms such as ‘abīvī’ should not exist.
					.filter(form => !form.includes('abīv'))
			);
		}

		else if (rest.Conjugations?.includes("faciō")) {
			if (!lemma.endsWith('faciō') && !lemma.endsWith('ficiō')) {
				console.warn('Doesn’t end with faciō or ficiō: ' + Lemma);
			}
			const prefix = lemma.replace(/f[ai]ciō$/, '');
			const hasReducedVowel = lemma.endsWith('ficiō');
			forms = {
				indicative: {
					active: {
						present: {
							singular: {
								first: ['faciō'],
								second: ['facis'],
								third: ['facit'],
							},
							plural: {
								first: ['facimus'],
								second: ['facitis'],
								third: ['faciunt'],
							},
						},
						imperfect: {
							singular: {
								first: ['faciēbam'],
								second: ['faciēbās'],
								third: ['faciēbat'],
							},
							plural: {
								first: ['faciēbāmus'],
								second: ['faciēbātis'],
								third: ['faciēbant'],
							},
						},
						future: {
							singular: {
								first: ['faciam'],
								second: ['faciēs'],
								third: ['faciet'],
							},
							plural: {
								first: ['faciēmus'],
								second: ['faciētis'],
								third: ['facient'],
							},
						},
						perfect: {
							singular: {
								first: ['fēcī'],
								second: ['fēcistī'],
								third: ['fēcit'],
							},
							plural: {
								first: ['fēcimus'],
								second: ['fēcistis'],
								third: ['fēcērunt', 'fēcēre'],
							},
						},
						pluperfect: {
							singular: {
								first: ['fēceram'],
								second: ['fēcerās'],
								third: ['fēcerat'],
							},
							plural: {
								first: ['fēcerāmus'],
								second: ['fēcerātis'],
								third: ['fēcerant'],
							},
						},
						futureperfect: {
							singular: {
								first: ['fēcerō'],
								second: ['fēceris'],
								third: ['fēcerit'],
							},
							plural: {
								first: ['fēcerimus'],
								second: ['fēceritis'],
								third: ['fēcerint'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								third: ['fit']
							},
						},
						imperfect: {
							singular: {
								third: ['fīēbat']
							},
						},
						future: {
							singular: {
								third: ['fīet']
							},
						},
					},
				},
				subjunctive: {
					active: {
						present: {
							singular: {
								first: ['faciam'],
								second: ['faciās'],
								third: ['faciat'],
							},
							plural: {
								first: ['faciāmus'],
								second: ['faciātis'],
								third: ['faciant'],
							},
						},
						imperfect: {
							singular: {
								first: ['facerem'],
								second: ['facerēs'],
								third: ['faceret'],
							},
							plural: {
								first: ['facerēmus'],
								second: ['facerētis'],
								third: ['facerent'],
							},
						},
						perfect: {
							singular: {
								first: ['fēcerim'],
								second: ['fēcerīs'],
								third: ['fēcerit'],
							},
							plural: {
								first: ['fēcerīmus'],
								second: ['fēcerītis'],
								third: ['fēcerint'],
							},
						},
						pluperfect: {
							singular: {
								first: ['fēcissem'],
								second: ['fēcissēs'],
								third: ['fēcisset'],
							},
							plural: {
								first: ['fēcissēmus'],
								second: ['fēcissētis'],
								third: ['fēcissent'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								third: ['fīat']
							},
						},
						imperfect: {
							singular: {
								third: ['fīeret', 'fieret']
							},
						},
					},
				},
				imperative: {
					active: {
						present: {
							singular: {
								second: ['face'],
							},
							plural: {
								second: ['facite'],
							},
						},
						future: {
							singular: {
								second: ['facitō'],
								third: ['facitō'],
							},
							plural: {
								second: ['facitōte'],
								third: ['faciuntō'],
							},
						},
					},
				},
				infinitive: {
					active: {
						present: ['facere'],
						perfect: ['fēcisse'],
					},
					passive: {
						present: ['fierī', 'fīerī']
					}
				},
				participle: {
					active: {
						present: inflectFuncs['Adjective']({ Lemma: 'faciēns' })
							.unencliticized
							.positive,
						future: inflectFuncs['Adjective']({ Lemma: 'factūrus' })
							.unencliticized
							.positive,
					},
					passive: {
						future: inflectFuncs['Adjective']({ Lemma: 'faciendus' })
							.unencliticized
							.positive,
					}
				},
				supine: {
					accusative: ['factum'],
					ablative: ['factū'],
				}
			}

			const transitiveForms = {
				indicative: {
					passive: {
						present: {
							singular: {
								first: ['fīō'],
								second: ['fīs'],
							},
							plural: {
								first: ['fīmus'],
								second: ['fītis'],
								third: ['fīunt']
							},
						},
						imperfect: {
							singular: {
								first: ['fīēbam'],
								second: ['fīēbās'],
							},
							plural: {
								first: ['fīēbāmus'],
								second: ['fīēbātis'],
								third: ['fīēbant']
							},
						},
						future: {
							singular: {
								first: ['fīam'],
								second: ['fīēs'],
							},
							plural: {
								first: ['fīēmus'],
								second: ['fīētis'],
								third: ['fīent']
							},
						},
					},
				},
				subjunctive: {
					passive: {
						present: {
							singular: {
								first: ['fīam'],
								second: ['fīās'],
							},
							plural: {
								first: ['fīāmus'],
								second: ['fīātis'],
								third: ['fīant']
							},
						},
						imperfect: {
							singular: {
								first: ['fīerem', 'fierem'],
								second: ['fīerēs', 'fierēs'],
							},
							plural: {
								first: ['fīerēmus', 'fierēmus'],
								second: ['fīerētis', 'fierētis'],
								third: ['fīerent', 'fierent']
							},
						},
					},
				},
				imperative: {
					passive: {
						present: {
							singular: {
								second: ['fī']
							},
							plural: {
								second: ['fīte']
							}
						},
						future: {
							singular: {
								second: ['fītō'],
								third: ['fītō'],
							},
							plural: {
								second: ['fītōte'],
								third: ['fīuntō']
							}
						}
					},
				},
				participle: {
					passive: {
						past: inflectFuncs['Adjective']({ Lemma: 'factus' })
							.unencliticized
							.positive,
					}
				}
			}

			if (!rest.IsIntransitive) {
				forms = mergeObjects(forms, transitiveForms);
			}

			// Attach the prefix to all the forms of ‘faciō’.
			forms = runLambdaOnObject(
				forms,
				(form) => joinStemsToEndings(prefix, form)
					// Correct the stem vowel for verbs like ‘perficiō’, but keep ‘calficiō/calfactum’.
					.map(form => hasReducedVowel ? form.replace(/(?<!cale?)fact/, 'fect').replace(/fac(?!t)/, 'fic') : form)
			);
		}

		const isDeponent = lemma.endsWith('or');

		if (rest.Conjugations?.includes(1) || rest.Conjugations?.includes("dō")) {
			const presentStem = lemma.replace(/(ō|or|at)$/, '');  // Replaces 1 in forms below.
			const perfectStems = rest.PerfectStems
				|| [(presentStem + 'āv')];                       // Replaces 3 in forms below.
			const supineStems = rest.SupineStems
			  || [(presentStem + 'āt')]                        // Replaces 4 in forms below.

			forms = {
				indicative: {
					active: {
						present: {
							singular: {
								first: ['1ō'],
								second: ['1ās'],
								third: ['1at'],
							},
							plural: {
								first: ['1āmus'],
								second: ['1ātis'],
								third: ['1ant'],
							},
						},
						imperfect: {
							singular: {
								first: ['1ābam'],
								second: ['1ābās'],
								third: ['1ābat'],
							},
							plural: {
								first: ['1ābāmus'],
								second: ['1ābātis'],
								third: ['1ābant'],
							},
						},
						future: {
							singular: {
								first: ['1ābō'],
								second: ['1ābis'],
								third: ['1ābit'],
							},
							plural: {
								first: ['1ābimus'],
								second: ['1ābitis'],
								third: ['1ābunt'],
							},
						},
						perfect: {
							singular: {
								first: ['3ī'],
								second: ['3istī'],
								third: ['3it'],
							},
							plural: {
								first: ['3imus'],
								second: ['3istis'],
								third: ['3ērunt', '3ēre'],
							},
						},
						pluperfect: {
							singular: {
								first: ['3eram'],
								second: ['3erās'],
								third: ['3erat'],
							},
							plural: {
								first: ['3erāmus'],
								second: ['3erātis'],
								third: ['3erant'],
							},
						},
						futureperfect: {
							singular: {
								first: ['3erō'],
								second: ['3eris'],
								third: ['3erit'],
							},
							plural: {
								first: ['3erimus'],
								second: ['3eritis'],
								third: ['3erint'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								first: ['1or'],
								second: ['1āris', '1āre'],
								third: ['1ātur'],
							},
							plural: {
								first: ['1āmur'],
								second: ['1āminī'],
								third: ['1antur'],
							},
						},
						imperfect: {
							singular: {
								first: ['1ābar'],
								second: ['1ābāris', '1ābāre'],
								third: ['1ābātur'],
							},
							plural: {
								first: ['1ābāmur'],
								second: ['1ābāminī'],
								third: ['1ābantur'],
							},
						},
						future: {
							singular: {
								first: ['1ābor'],
								second: ['1āberis', '1ābere'],
								third: ['1ābitur'],
							},
							plural: {
								first: ['1ābimur'],
								second: ['1ābiminī'],
								third: ['1ābuntur'],
							},
						},
					},
				},
				subjunctive: {
					active: {
						present: {
							singular: {
								first: ['1em'],
								second: ['1ēs'],
								third: ['1et'],
							},
							plural: {
								first: ['1ēmus'],
								second: ['1ētis'],
								third: ['1ent'],
							},
						},
						imperfect: {
							singular: {
								first: ['1ārem'],
								second: ['1ārēs'],
								third: ['1āret'],
							},
							plural: {
								first: ['1ārēmus'],
								second: ['1ārētis'],
								third: ['1ārent'],
							},
						},
						perfect: {
							singular: {
								first: ['3erim'],
								second: ['3erīs'],
								third: ['3erit'],
							},
							plural: {
								first: ['3erīmus'],
								second: ['3erītis'],
								third: ['3erint'],
							},
						},
						pluperfect: {
							singular: {
								first: ['3issem'],
								second: ['3issēs'],
								third: ['3isset'],
							},
							plural: {
								first: ['3issēmus'],
								second: ['3issētis'],
								third: ['3issent'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								first: ['1er'],
								second: ['1ēris', '1ēre'],
								third: ['1ētur'],
							},
							plural: {
								first: ['1ēmur'],
								second: ['1ēminī'],
								third: ['1entur'],
							},
						},
						imperfect: {
							singular: {
								first: ['1ārer'],
								second: ['1ārēris', '1ārēre'],
								third: ['1ārētur'],
							},
							plural: {
								first: ['1ārēmur'],
								second: ['1ārēminī'],
								third: ['1ārentur'],
							},
						},
					},
				},
				imperative: {
					active: {
						present: {
							singular: {
								second: ['1ā'],
							},
							plural: {
								third: ['1āte'],
							},
						},
						future: {
							singular: {
								second: ['1ātō'],
								third: ['1ātō'],
							},
							plural: {
								second: ['1ātōte'],
								third: ['1antō'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								second: ['1āre'],
							},
							plural: {
								third: ['1āminī'],
							},
						},
						future: {
							singular: {
								second: ['1ātor'],
								third: ['1ātor'],
							},
							plural: {
								third: ['1antor'],
							},
						},
					},
				},
				infinitive: {
					active: {
						present: ['1āre'],
						past: ['3isse'],
					},
					passive: {
						present: ['1ārī'],
					},
				},
				participle: {
					active: {
						present: inflectFuncs['Adjective']({ Lemma: '1āns' })
							.unencliticized
							.positive,
						future: inflectFuncs['Adjective']({ Lemma: '4ūrus' })
							.unencliticized
							.positive,
					},
					passive: {
						past: inflectFuncs['Adjective']({ Lemma: '4us' })
							.unencliticized
							.positive,
						future: inflectFuncs['Adjective']({ Lemma: '1andus' })
							.unencliticized
							.positive,
					},
				},
				supine: {
					accusative: ['4um'],
					ablative: ['4ū'],
				}
			};

			if (rest.HasArchaicInfinitiveInIer) {
				forms = mergeObjects(forms, { infinitive: { passive: { present: ['1ārier'] } } })
			}

			forms = runLambdaOnObject(forms, form => {
				if (form.startsWith('1')) {
					return joinStemsToEndings(presentStem, form.substring(1));
				}
				if (form.startsWith('3')) {
					return joinStemsToEndings(perfectStems, form.substring(1));
				}
				if (form.startsWith('4')) {
					return joinStemsToEndings(supineStems, form.substring(1));
				}
				return form;
			});

			if (rest.Conjugations.includes("dō")) {
				// Perfect stem should be “ded”.
				// “a” in endings should be short (except in ‘dā’, ‘dās’, ‘dāns’).
				forms = runLambdaOnObject(forms, form => form.replace(/dāv(?=[^d]+$)/, 'ded').replace(/dā(?!ns)(?!s)(?=.)(?=[^d]+$)/, 'da'));
			}
		}

		if (rest.Conjugations?.includes(2)) {
			const presentStem = lemma.replace(/e(ō|or|t)$/, '');  // Replaces 1 in forms below.
			const perfectStems = rest.PerfectStems
				|| [(presentStem + 'u')];                        // Replaces 3 in forms below.
			const supineStems = rest.SupineStems
			  || [(presentStem + 'it')]                        // Replaces 4 in forms below.

			forms = {
				indicative: {
					active: {
						present: {
							singular: {
								first: ['1eō'],
								second: ['1ēs'],
								third: ['1et'],
							},
							plural: {
								first: ['1ēmus'],
								second: ['1ētis'],
								third: ['1ent'],
							},
						},
						imperfect: {
							singular: {
								first: ['1ēbam'],
								second: ['1ēbās'],
								third: ['1ēbat'],
							},
							plural: {
								first: ['1ēbāmus'],
								second: ['1ēbātis'],
								third: ['1ēbant'],
							},
						},
						future: {
							singular: {
								first: ['1ēbō'],
								second: ['1ēbis'],
								third: ['1ēbit'],
							},
							plural: {
								first: ['1ēbimus'],
								second: ['1ēbitis'],
								third: ['1ēbunt'],
							},
						},
						perfect: {
							singular: {
								first: ['3ī'],
								second: ['3istī'],
								third: ['3it'],
							},
							plural: {
								first: ['3imus'],
								second: ['3istis'],
								third: ['3ērunt', '3ēre'],
							},
						},
						pluperfect: {
							singular: {
								first: ['3eram'],
								second: ['3erās'],
								third: ['3erat'],
							},
							plural: {
								first: ['3erāmus'],
								second: ['3erātis'],
								third: ['3erant'],
							},
						},
						futureperfect: {
							singular: {
								first: ['3erō'],
								second: ['3eris'],
								third: ['3erit'],
							},
							plural: {
								first: ['3erimus'],
								second: ['3eritis'],
								third: ['3erint'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								first: ['1eor'],
								second: ['1ēris', '1ēre'],
								third: ['1ētur'],
							},
							plural: {
								first: ['1ēmur'],
								second: ['1ēminī'],
								third: ['1entur'],
							},
						},
						imperfect: {
							singular: {
								first: ['1ēbar'],
								second: ['1ēbāris', '1ēbāre'],
								third: ['1ēbātur'],
							},
							plural: {
								first: ['1ēbāmur'],
								second: ['1ēbāminī'],
								third: ['1ēbantur'],
							},
						},
						future: {
							singular: {
								first: ['1ēbor'],
								second: ['1ēberis', '1ēbere'],
								third: ['1ēbitur'],
							},
							plural: {
								first: ['1ēbimur'],
								second: ['1ēbiminī'],
								third: ['1ēbuntur'],
							},
						},
					},
				},
				subjunctive: {
					active: {
						present: {
							singular: {
								first: ['1eam'],
								second: ['1eās'],
								third: ['1eat'],
							},
							plural: {
								first: ['1eāmus'],
								second: ['1eātis'],
								third: ['1eant'],
							},
						},
						imperfect: {
							singular: {
								first: ['1ērem'],
								second: ['1ērēs'],
								third: ['1ēret'],
							},
							plural: {
								first: ['1ērēmus'],
								second: ['1ērētis'],
								third: ['1ērent'],
							},
						},
						perfect: {
							singular: {
								first: ['3erim'],
								second: ['3erīs'],
								third: ['3erit'],
							},
							plural: {
								first: ['3erīmus'],
								second: ['3erītis'],
								third: ['3erint'],
							},
						},
						pluperfect: {
							singular: {
								first: ['3issem'],
								second: ['3issēs'],
								third: ['3isset'],
							},
							plural: {
								first: ['3issēmus'],
								second: ['3issētis'],
								third: ['3issent'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								first: ['1ear'],
								second: ['1eāris', '1eāre'],
								third: ['1eātur'],
							},
							plural: {
								first: ['1eāmur'],
								second: ['1eāminī'],
								third: ['1eantur'],
							},
						},
						imperfect: {
							singular: {
								first: ['1ērer'],
								second: ['1ērēris', '1ērēre'],
								third: ['1ērētur'],
							},
							plural: {
								first: ['1ērēmur'],
								second: ['1ērēminī'],
								third: ['1ērentur'],
							},
						},
					},
				},
				imperative: {
					active: {
						present: {
							singular: {
								second: ['1ē'],
							},
							plural: {
								third: ['1ēte'],
							},
						},
						future: {
							singular: {
								second: ['1ētō'],
								third: ['1ētō'],
							},
							plural: {
								second: ['1ētōte'],
								third: ['1entō'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								second: ['1ēre'],
							},
							plural: {
								third: ['1ēminī'],
							},
						},
						future: {
							singular: {
								second: ['1ētor'],
								third: ['1ētor'],
							},
							plural: {
								third: ['1entor'],
							},
						},
					},
				},
				infinitive: {
					active: {
						present: ['1ēre'],
						past: ['3isse'],
					},
					passive: {
						present: ['1ērī'],
					},
				},
				participle: {
					active: {
						present: inflectFuncs['Adjective']({ Lemma: '1ēns' })
							.unencliticized
							.positive,
						future: inflectFuncs['Adjective']({ Lemma: '4ūrus' })
							.unencliticized
							.positive,
					},
					passive: {
						past: inflectFuncs['Adjective']({ Lemma: '4us' })
							.unencliticized
							.positive,
						future: inflectFuncs['Adjective']({ Lemma: '1endus' })
							.unencliticized
							.positive,
					},
				},
				supine: {
					accusative: ['4um'],
					ablative: ['4ū'],
				}
			};

			if (rest.HasArchaicInfinitiveInIer) {
				forms = mergeObjects(forms, { infinitive: { passive: { present: ['1ērier'] } } })
			}

			forms = runLambdaOnObject(forms, form => {
				if (form.startsWith('1')) {
					return joinStemsToEndings(presentStem, form.substring(1));
				}
				if (form.startsWith('3')) {
					return joinStemsToEndings(perfectStems, form.substring(1));
				}
				if (form.startsWith('4')) {
					return joinStemsToEndings(supineStems, form.substring(1));
				}
				return form;
			});
		}

		if (rest.Conjugations?.includes(3)) {
			if (!rest.SupineStems) {
				console.warn('SupineStems not set for ' + Lemma);
			}
			if (!rest.PerfectStems && !isDeponent && !rest.IsSemiDeponent) {
				console.warn('PerfectStems not set for ' + Lemma);
			}

			const presentStem = lemma.replace(/(ō|or|it)$/, '');          // Replaces 1 in forms below.
			const presentInfinitiveStem = presentStem.replace(/i$/, '');  // Replaces 2 in forms below.
			const perfectStems = rest.PerfectStems
				|| [(presentStem + 's')];                                   // Replaces 3 in forms below.
			const supineStems = rest.SupineStems
			  || [(presentStem + 't')]                                    // Replaces 4 in forms below.
			const futureActiveParticipleStems
				= rest.FutureActiveParticipleStems || supineStems           // Replaces 5 in forms below.
			const gerundVowels = rest.GerundVowels || ['e'];
			const gerundStemsAsFarAsVowel
				= joinStemsToEndings(presentStem, gerundVowels);            // Eg "geru" for "gerundum"; replaces 6 in forms below.

			forms = {
				indicative: {
					active: {
						present: {
							singular: {
								first: ['1ō'],
								second: ['2is'],
								third: ['2it'],
							},
							plural: {
								first: ['2imus'],
								second: ['2itis'],
								third: ['1unt'],
							},
						},
						imperfect: {
							singular: {
								first: ['1ēbam'],
								second: ['1ēbās'],
								third: ['1ēbat'],
							},
							plural: {
								first: ['1ēbāmus'],
								second: ['1ēbātis'],
								third: ['1ēbant'],
							},
						},
						future: {
							singular: {
								first: ['1am'],
								second: ['1ēs'],
								third: ['1et'],
							},
							plural: {
								first: ['1ēmus'],
								second: ['1ētis'],
								third: ['1ent'],
							},
						},
						perfect: {
							singular: {
								first: ['3ī'],
								second: ['3istī'],
								third: ['3it'],
							},
							plural: {
								first: ['3imus'],
								second: ['3istis'],
								third: ['3ērunt', '3ēre'],
							},
						},
						pluperfect: {
							singular: {
								first: ['3eram'],
								second: ['3erās'],
								third: ['3erat'],
							},
							plural: {
								first: ['3erāmus'],
								second: ['3erātis'],
								third: ['3erant'],
							},
						},
						futureperfect: {
							singular: {
								first: ['3erō'],
								second: ['3eris'],
								third: ['3erit'],
							},
							plural: {
								first: ['3erimus'],
								second: ['3eritis'],
								third: ['3erint'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								first: ['1or'],
								second: ['2eris', '2ere'],
								third: ['2itur'],
							},
							plural: {
								first: ['2imur'],
								second: ['2iminī'],
								third: ['1untur'],
							},
						},
						imperfect: {
							singular: {
								first: ['1ēbar'],
								second: ['1ēbāris', '1ēbāre'],
								third: ['1ēbātur'],
							},
							plural: {
								first: ['1ēbāmur'],
								second: ['1ēbāminī'],
								third: ['1ēbantur'],
							},
						},
						future: {
							singular: {
								first: ['1ar'],
								second: ['1ēris', '1ēre'],
								third: ['1ētur'],
							},
							plural: {
								first: ['1ēmur'],
								second: ['1ēminī'],
								third: ['1entur'],
							},
						},
					},
				},
				subjunctive: {
					active: {
						present: {
							singular: {
								first: ['1am'],
								second: ['1ās'],
								third: ['1at'],
							},
							plural: {
								first: ['1āmus'],
								second: ['1ātis'],
								third: ['1ant'],
							},
						},
						imperfect: {
							singular: {
								first: ['2erem'],
								second: ['2erēs'],
								third: ['2eret'],
							},
							plural: {
								first: ['2erēmus'],
								second: ['2erētis'],
								third: ['2erent'],
							},
						},
						perfect: {
							singular: {
								first: ['3erim'],
								second: ['3erīs'],
								third: ['3erit'],
							},
							plural: {
								first: ['3erīmus'],
								second: ['3erītis'],
								third: ['3erint'],
							},
						},
						pluperfect: {
							singular: {
								first: ['3issem'],
								second: ['3issēs'],
								third: ['3isset'],
							},
							plural: {
								first: ['3issēmus'],
								second: ['3issētis'],
								third: ['3issent'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								first: ['1ar'],
								second: ['1āris', '1āre'],
								third: ['1ātur'],
							},
							plural: {
								first: ['1āmur'],
								second: ['1āminī'],
								third: ['1antur'],
							},
						},
						imperfect: {
							singular: {
								first: ['2erer'],
								second: ['2erēris', '2erēre'],
								third: ['2erētur'],
							},
							plural: {
								first: ['2erēmur'],
								second: ['2erēminī'],
								third: ['2erentur'],
							},
						},
					},
				},
				imperative: {
					active: {
						present: {
							singular: {
								second: ['2e'],
							},
							plural: {
								third: ['2ite'],
							},
						},
						future: {
							singular: {
								second: ['2itō'],
								third: ['2itō'],
							},
							plural: {
								second: ['2itōte'],
								third: ['1untō'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								second: ['2ere'],
							},
							plural: {
								third: ['2iminī'],
							},
						},
						future: {
							singular: {
								second: ['2itor'],
								third: ['2itor'],
							},
							plural: {
								third: ['1untor'],
							},
						},
					},
				},
				infinitive: {
					active: {
						present: ['2ere'],
						past: ['3isse'],
					},
					passive: {
						present: ['2ī'],
					},
				},
				participle: {
					active: {
						present: inflectFuncs['Adjective']({ Lemma: '1ēns' })
							.unencliticized
							.positive,
						future: inflectFuncs['Adjective']({ Lemma: '5ūrus' })
							.unencliticized
							.positive,
					},
					passive: {
						past: inflectFuncs['Adjective']({ Lemma: '4us' })
							.unencliticized
							.positive,
						future: inflectFuncs['Adjective']({ Lemma: '6ndus' })
							.unencliticized
							.positive,
					},
				},
				supine: {
					accusative: ['4um'],
					ablative: ['4ū'],
				}
			};

			if (rest.HasArchaicInfinitiveInIer) {
				forms = mergeObjects(forms, { infinitive: { passive: { present: ['2ier'] } } })
			}

			forms = runLambdaOnObject(forms, form => {
				if (form.startsWith('1')) {
					return joinStemsToEndings(presentStem, form.substring(1));
				}
				if (form.startsWith('2')) {
					return joinStemsToEndings(presentInfinitiveStem, form.substring(1));
				}
				if (form.startsWith('3')) {
					return joinStemsToEndings(perfectStems, form.substring(1));
				}
				if (form.startsWith('4')) {
					return joinStemsToEndings(supineStems, form.substring(1));
				}
				if (form.startsWith('5')) {
					return joinStemsToEndings(futureActiveParticipleStems, form.substring(1));
				}
				if (form.startsWith('6')) {
					return joinStemsToEndings(gerundStemsAsFarAsVowel, form.substring(1));
				}
				return form;
			});
		}

		if (rest.Conjugations?.includes(4)) {
			const presentStem = lemma.replace(/i(ō|or)$/, '');  // Replaces 1 in forms below.
			const perfectStems = rest.PerfectStems
				|| [(presentStem + 'īv')];                        // Replaces 3 in forms below.
			const supineStems = rest.SupineStems
			  || [(presentStem + 'īt')]                         // Replaces 4 in forms below.
			const futureActiveParticipleStems
				= rest.FutureActiveParticipleStems || supineStems           // Replaces 5 in forms below.
			const gerundVowels = rest.GerundVowels || ['e'];
			const gerundStemsAsFarAsVowel
				= joinStemsToEndings(presentStem + 'i', gerundVowels);      // Eg "oriu" for "oriundum"; replaces 6 in forms below.

			forms = {
				indicative: {
					active: {
						present: {
							singular: {
								first: ['1iō'],
								second: ['1īs'],
								third: ['1it'],
							},
							plural: {
								first: ['1īmus'],
								second: ['1ītis'],
								third: ['1iunt'],
							},
						},
						imperfect: {
							singular: {
								first: ['1iēbam'],
								second: ['1iēbās'],
								third: ['1iēbat'],
							},
							plural: {
								first: ['1iēbāmus'],
								second: ['1iēbātis'],
								third: ['1iēbant'],
							},
						},
						future: {
							singular: {
								first: ['1iam'],
								second: ['1iēs'],
								third: ['1iet'],
							},
							plural: {
								first: ['1iēmus'],
								second: ['1iētis'],
								third: ['1ient'],
							},
						},
						perfect: {
							singular: {
								first: ['3ī'],
								second: ['3istī'],
								third: ['3it'],
							},
							plural: {
								first: ['3imus'],
								second: ['3istis'],
								third: ['3ērunt', '3ēre'],
							},
						},
						pluperfect: {
							singular: {
								first: ['3eram'],
								second: ['3erās'],
								third: ['3erat'],
							},
							plural: {
								first: ['3erāmus'],
								second: ['3erātis'],
								third: ['3erant'],
							},
						},
						futureperfect: {
							singular: {
								first: ['3erō'],
								second: ['3eris'],
								third: ['3erit'],
							},
							plural: {
								first: ['3erimus'],
								second: ['3eritis'],
								third: ['3erint'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								first: ['1ior'],
								second: ['1īris', '1īre'],
								third: ['1ītur'],
							},
							plural: {
								first: ['1īmur'],
								second: ['1īminī'],
								third: ['1iuntur'],
							},
						},
						imperfect: {
							singular: {
								first: ['1iēbar'],
								second: ['1iēbāris', '1iēbāre'],
								third: ['1iēbātur'],
							},
							plural: {
								first: ['1iēbāmur'],
								second: ['1iēbāminī'],
								third: ['1iēbantur'],
							},
						},
						future: {
							singular: {
								first: ['1iar'],
								second: ['1iēris', '1iēre'],
								third: ['1iētur'],
							},
							plural: {
								first: ['1iēmur'],
								second: ['1iēminī'],
								third: ['1ientur'],
							},
						},
					},
				},
				subjunctive: {
					active: {
						present: {
							singular: {
								first: ['1iam'],
								second: ['1iās'],
								third: ['1iat'],
							},
							plural: {
								first: ['1iāmus'],
								second: ['1iātis'],
								third: ['1iant'],
							},
						},
						imperfect: {
							singular: {
								first: ['1īrem'],
								second: ['1īrēs'],
								third: ['1īret'],
							},
							plural: {
								first: ['1īrēmus'],
								second: ['1īrētis'],
								third: ['1īrent'],
							},
						},
						perfect: {
							singular: {
								first: ['3erim'],
								second: ['3erīs'],
								third: ['3erit'],
							},
							plural: {
								first: ['3erīmus'],
								second: ['3erītis'],
								third: ['3erint'],
							},
						},
						pluperfect: {
							singular: {
								first: ['3issem'],
								second: ['3issēs'],
								third: ['3isset'],
							},
							plural: {
								first: ['3issēmus'],
								second: ['3issētis'],
								third: ['3issent'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								first: ['1iar'],
								second: ['1iāris', '1iāre'],
								third: ['1iātur'],
							},
							plural: {
								first: ['1iāmur'],
								second: ['1iāminī'],
								third: ['1iantur'],
							},
						},
						imperfect: {
							singular: {
								first: ['1īrer'],
								second: ['1īrēris', '1īrēre'],
								third: ['1īrētur'],
							},
							plural: {
								first: ['1īrēmur'],
								second: ['1īrēminī'],
								third: ['1īrentur'],
							},
						},
					},
				},
				imperative: {
					active: {
						present: {
							singular: {
								second: ['1ī'],
							},
							plural: {
								third: ['1īte'],
							},
						},
						future: {
							singular: {
								second: ['1ītō'],
								third: ['1ītō'],
							},
							plural: {
								second: ['1ītōte'],
								third: ['1iuntō'],
							},
						},
					},
					passive: {
						present: {
							singular: {
								second: ['1īre'],
							},
							plural: {
								second: ['1īminī'],
							},
						},
						future: {
							singular: {
								second: ['1ītor'],
								third: ['1ītor'],
							},
							plural: {
								third: ['1iuntor'],
							},
						},
					},
				},
				infinitive: {
					active: {
						present: ['1īre'],
						past: ['3isse'],
					},
					passive: {
						present: ['1īrī'],
					},
				},
				participle: {
					active: {
						present: inflectFuncs['Adjective']({ Lemma: '1iēns' })
							.unencliticized
							.positive,
						future: inflectFuncs['Adjective']({ Lemma: '5ūrus' })
							.unencliticized
							.positive,
					},
					passive: {
						past: inflectFuncs['Adjective']({ Lemma: '4us' })
							.unencliticized
							.positive,
						future: inflectFuncs['Adjective']({ Lemma: '6ndus' })
							.unencliticized
							.positive,
					},
				},
				supine: {
					accusative: ['4um'],
					ablative: ['4ū'],
				}
			};

			if (rest.HasArchaicInfinitiveInIer) {
				forms = mergeObjects(forms, { infinitive: { passive: { present: ['1īrier'] } } })
			}

			forms = runLambdaOnObject(forms, form => {
				if (form.startsWith('1')) {
					return joinStemsToEndings(presentStem, form.substring(1));
				}
				if (form.startsWith('3')) {
					return joinStemsToEndings(perfectStems, form.substring(1));
				}
				if (form.startsWith('4')) {
					return joinStemsToEndings(supineStems, form.substring(1));
				}
				if (form.startsWith('5')) {
					return joinStemsToEndings(futureActiveParticipleStems, form.substring(1));
				}
				if (form.startsWith('6')) {
					return joinStemsToEndings(gerundStemsAsFarAsVowel, form.substring(1));
				}
				return form;
			});
		}

		if (rest.Conjugations?.length > 1) {
			console.warn(`Verb ${Lemma} may be misconjugated because its conjugations are given as `, rest.Conjugations);
		}

		if (JSON.stringify(forms)==='{}') {

			if (!rest.Conjugations || !rest.Conjugations.length) {
				console.debug('Conjugations not specified for', Lemma);
			}

			console.warn("No forms for " + Lemma)
			return {}
		}

		if (isDeponent) {
			forms.indicative.active = forms.indicative.passive;
			delete forms.indicative.passive;
			forms.subjunctive.active = forms.subjunctive.passive;
			delete forms.subjunctive.passive;
			forms.infinitive.active = forms.infinitive.passive;
			delete forms.infinitive.passive;
			forms.imperative.active = forms.imperative.passive;
			delete forms.imperative.passive;
			forms.participle.active.past = forms.participle.passive.past;
			delete forms.participle.passive.past;
		}

		if (rest.IsSemiDeponent) {
			delete forms.indicative.active.perfect;
			delete forms.indicative.active.pluperfect;
			delete forms.indicative.active.futureperfect;
			delete forms.subjunctive.active.perfect;
			delete forms.subjunctive.active.pluperfect;
			delete forms.infinitive.active.past;

			delete forms.indicative.passive;
			delete forms.subjunctive.passive;
			delete forms.imperative.passive;
			delete forms.infinitive.passive;

			forms.participle.active.past = forms.participle.passive.past;
			delete forms.participle.passive.past;
		}

		if (rest.IsImpersonal) {
			forms = deleteUnwantedForms(forms, ['first', 'second', 'plural', 'supine'])
			delete forms.indicative.passive;
			delete forms.subjunctive.passive;
			delete forms.infinitive.passive;
			delete forms.imperative.passive;
			delete forms.participle.passive.future;
			delete forms.participle.passive.past.masculine;
			delete forms.participle.passive.past.feminine;
			delete forms.participle.passive.past.neuter.plural;
		}

		// ‘eō’ verbs are excluded from this handling of intransitive verbs because it would wrongly delete impersonal-passive forms.
		if (rest.IsIntransitive && !rest.Conjugations.includes('eō')) {
			forms.participle.active.past = forms.participle.passive.past;
			forms = replaceFieldsInObjects(forms, emptyFieldsForIntransitiveVerbs);
		}
		if (lemma.endsWith('scō')
			&& rest.IsIntransitive !== true
			&& rest.IsIntransitive !== false
		) {
			console.warn(`IsIntransitive is not set for ${lemma}`);
		}
	}

	//  if (rest["20230115"] && rest.Conjugations?.includes(1)) {
	// 	console.log(`Conjugations ${rest.Conjugations} for ${Lemma}`);
	//  }

		return applyFieldsToForms(forms, rest);
	},
}

const convertParsingObjectToFormsArray = (parsingObject) =>{
	if (!parsingObject) {
		console.warn(`parsingObject is ${parsingObject} in convertParsingObjectToFormsArray`);
		return [];
	}
	if (Array.isArray(parsingObject)) {
		return parsingObject;
	}
	if (typeof parsingObject === "string") {
		console.warn(`parsingObject is a string: ${parsingObject}`)
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
				let noTestDataCount = 0;
				let totalLemmata = 0;
				let incorrectComparatives = 0;
				// const totalLemmata = outputEntries.length;

				batchFilepaths.forEach((filename) => {
					const outputBatch = require(filename);
					const outputEntries = Object.entries(outputBatch);

					for ([lemma, parsingData] of outputEntries) {
						totalLemmata++;

						if (!parsingData) {
							//// parsingData should be an object, which is always truthy.
							//// (Even an empty object is truthy.)
							//// So entering this branch would be strange.
							console.debug(lemma)
							continue;
						}
						if (Object.keys(parsingData).length === 0) {
							//// The Inflector returns {} for lemmata it doesn’t know
							//// how to inflect, so there are no forms to compare here.
							//// These lemmata will be counted as “skipped”.
							const unprefixed = lemma.replace(/^(abs(?=c)|ab|af(?=f)|ad|al(?=l)|ante|ap(?=p)|ar(?=r)|as(?=s)|at(?=t)|circum|col(?=f)|com(?=[mp])|contrā|con|cōn(?=[fs])|cor(?=r)|dē|dī(?=[mrv])|dif(?=f)|dis|ē|ex|il(?=l)|im(?=[mp])|inter|intrō|in|īn(?=[fs])|ob|oc(?=c)|of(?=f)|op(?=p)|pel(?=l)|per|praeter|prae|prō|re|sē|subter|sub|suc(?=c)|suf(?=f)|super|sur(?=r)|trāns|.+)/, '')

							const guessConjugationFromExistingForms = (lemmaToTest, shouldLog = true) => {
								if (!expectedOutput[lemmaToTest]) { return; }

								const lemmasExpectedOutput = [...expectedOutput[lemmaToTest]];
								// console.debug(lemma);

								let didIfStatementsMatch = true;
								if (lemmasExpectedOutput.some(form => form.endsWith('āns'))) {
									shouldLog && console.log('Possible first conjugation: ', lemma);
								}
								else if (/iō(\[[^\]]+\])?$/.test(lemmaToTest) && lemmasExpectedOutput.every(form => !form.endsWith('ere')) && lemmasExpectedOutput.every(form => !form.endsWith('faciō'))) {
									shouldLog && console.log('Possible fourth conjugation: ', lemma);
									shouldLog && console.log(expectedOutput[lemmaToTest])
								}
								else if (/eō(\[[^\]]+\])?$/.test(lemmaToTest) && lemmasExpectedOutput.every(form => !form.endsWith('īre')) && lemmasExpectedOutput.every(form => !form.endsWith('iēns'))) {
									shouldLog && console.log('Possible second conjugation: ', lemma);
									shouldLog && console.log(expectedOutput[lemmaToTest])
								}
								else if (/(?<!grad|gred|mor)ior(\[[^\]]+\])?$/.test(lemmaToTest) && lemmasExpectedOutput.every(form => !form.endsWith('ere')) && lemmasExpectedOutput.every(form => !form.endsWith('iāns'))) {
									shouldLog && console.log('Possible fourth conjugation: ', lemma);
									shouldLog && console.log(expectedOutput[lemmaToTest])
								}
								else if (/eō(\[[^\]]+\])?$/.test(lemmaToTest) && lemmasExpectedOutput.every(form => !form.endsWith('īre')) && lemmasExpectedOutput.every(form => !form.endsWith('iēns'))) {
									shouldLog && console.log('Possible second conjugation: ', lemma);
									shouldLog && console.log(expectedOutput[lemmaToTest])
								}
								else if (/eor(\[[^\]]+\])?$/.test(lemmaToTest) && lemmasExpectedOutput.every(form => !form.endsWith('iēns'))) {
									shouldLog && console.log('Possible second conjugation: ', lemma);
									shouldLog && console.log(expectedOutput[lemmaToTest])
								}
								else if (lemmasExpectedOutput.some(form => form.endsWith('ere'))) {
									shouldLog && console.log('Possible third conjugation: ', lemma);
								}
								else {
									didIfStatementsMatch = false;
								}
								return didIfStatementsMatch;
							}

							if (/(cipiō|cutiō|fugiō|ripiō|iciō)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible third conjugation (-iō): ', lemma);
							}
							else if (guessConjugationFromExistingForms(lemma, false)) {
								// Do nothing.
							}
							else if (/or(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Deponent: ', lemma);
							}
							else if (/(āscō|ēscō|īscō)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible third conjugation (inchoative): ', lemma);
							}
							else if (/(faciō|ficiō)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible third conjugation (faciō): ', lemma);
							}
							else if (/(ferō)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible irregular (ferō): ', lemma);
							}
							else if (/(eō)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible irregular (eō): ', lemma);
							}
							else if (/āre\]$/.test(lemma)) {
								// console.log('Possible first conjugation: ', lemma);
							}
							else if (/ēre\]$/.test(lemma)) {
								// console.log('Possible second conjugation: ', lemma);
							}
							else if (/ere\]$/.test(lemma)) {
							// 	console.log('Possible third conjugation: ', lemma);
							}
							else if (/īre\]$/.test(lemma)) {
								// console.log('Possible fourth conjugation: ', lemma);
							}
							else if (/(at)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible first conjugation impersonal: ', lemma);
							}
							else if (/(et)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible second conjugation impersonal: ', lemma);
							}
							else if (/(it)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible third conjugation impersonal: ', lemma);
							}
							else if (unprefixed && guessConjugationFromExistingForms(unprefixed, false)) {
								// Do nothing
							}
							else if (/(aggerō|aliēnō|colōrō|culcō|ficō|fōcō|fortō|frēnō|frūstrō|lārvō|līberō|ligō|mūtō|plōrō|pūstulō|turbō)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible first conjugation: ', lemma);
								// console.log(expectedOutput[lemma])
							}
							else if (/(ō)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible third conjugation: ', lemma);
								// console.log(expectedOutput[lemma])
							}
							else if (!['rēfert', 'inquam', 'coepī', 'meminī', 'ōdī', 'potin', 'laecasīn', 'cum[v]'].includes(lemma)) {
								console.log('Might not be a verb: ', lemma);
							}
							else {
								// console.log('Unknown conjugation: ', lemma);
							}
							continue;
						}

						if (expectedOutput[lemma] === undefined) {
							console.warn('No expected output for ' + lemma);
							noTestDataCount++;
							continue;
						}

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
							// const parsingDataAsJson = JSON.stringify(parsingData)
							// console.log({parsingDataAsJson})

							const comparativeForm = parsingData.unencliticized?.comparative?.neuter?.singular?.nominative?.[0]
								?? parsingData.unencliticized?.comparative?.[0];
							if (comparativeForm) {
								if (!expectedFormsAsSet.has(comparativeForm)) {
									const lemmataToNotComplainAboutComparativesFor = [
										"iūrisperītus", "celeriter", "sērus", "posterus", "novus", "nōtus", "multus", "lūcidus", "limpidus", "inīquus", "grātus", "fīdus", "falsus", "aptus", "noviter", "altus", "inter", "citer", "fortis", "piger", "similis", "efficāx", "adrogāns", "āctuōsus", "frequenter", "mānsuēs", "vetus", "malevolus", "maleficus", "benevolus", "benivolus", "beneficus", "dissimilis", "gracilis"
									];
										if (!lemmataToNotComplainAboutComparativesFor.includes(lemma)) {
											console.log(`${lemma} should not have comparative form ${comparativeForm}`);
											// console.log(`${comparativeForm}`);
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
							// console.error(lemma)
						}

						//// If I had added incorrect forms to velut in Excel,
						//// I’ve used the ExtraEncliticizedForms field in the input Json
						//// to add an "incorrect" array of those forms to the output object.
						//// This is to ensure that all forms that were in Excel are
						//// output by the Inflector, while also ensuring incorrect forms
						//// can be easily filtered out.
						//// The following if/else-block tests whether these forms appear
						//// elsewhere in the output object — they shouldn’t.
						if (parsingData.incorrect) {
							const incorrectFormsSet = convertParsingObjectToFormsSet(parsingData.incorrect);
							delete parsingData.incorrect;
							const correctFormsSet = convertParsingObjectToFormsSet(parsingData);
							const formsBothCorrectAndNotIncorrect = subtractSet(correctFormsSet, incorrectFormsSet);
							if (isEqualSet(correctFormsSet, formsBothCorrectAndNotIncorrect)) {
								// console.log("Success — no incorrect forms are considered correct for " + lemma);
							} else {
								const formsBothCorrectAndIncorrect = subtractSet(correctFormsSet, formsBothCorrectAndNotIncorrect);
								console.warn("Warning — incorrect forms are considered correct for " + lemma)
								console.debug(formsBothCorrectAndIncorrect);
								consoleLogAsJson(parsingData);
							}
						}
					}
				});
				const skippedCount = totalLemmata - errorCount - successCount - noTestDataCount;
				console.warn(`There were ${incorrectComparatives} lemmata with unwanted comparatives.`);
				console.warn(`There were ${errorCount} mismatches (and ${successCount} successes, ${skippedCount} skipped, and ${noTestDataCount} with no existing forms data to compare) out of ${totalLemmata} lemmata.`);

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
