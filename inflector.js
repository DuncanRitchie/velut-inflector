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
		.filter(([key, obj]) => obj !== null && obj !== undefined)
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
			const withEnclitics = multiplyWithEnclitics({ positive: lemma });
			return deleteUnwantedForms(withEnclitics, rest.ParsingsToExclude);
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
			const withReplacements = replaceFieldsInObjects(allUnencliticizedForms, rest.ReplacementForms);
			const withExtraForms = mergeObjects(withReplacements, rest.ExtraForms);
			const withEnclitics = multiplyWithEnclitics(withExtraForms);
			const withReplacementEncliticizedForms = replaceFieldsInObjects(withEnclitics, rest.ReplacementEncliticizedForms);
			const withExtraEncliticizedForms = mergeObjects(withReplacementEncliticizedForms, rest.ExtraEncliticizedForms);
			const withQueLemmaHandled = markQueAsUnencliticized(withExtraEncliticizedForms, rest.IsLemmaInQue);
			const wantedForms = deleteUnwantedForms(withQueLemmaHandled, rest.ParsingsToExclude);
			return wantedForms;
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
			return false;
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
		const withReplacements = replaceFieldsInObjects(allUnencliticizedForms, rest.ReplacementForms)
		const withEnclitics = multiplyWithEnclitics(withReplacements);
		const wantedForms = deleteUnwantedForms(withEnclitics, rest.ParsingsToExclude);
		return mergeObjects(wantedForms, rest.ExtraForms);
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
			if (lemma.endsWith("us")) {
				console.log('Assuming 2nd declension for ' + Lemma);
			}
			if (
				(lemma.endsWith("us"))
				|| (lemma.endsWith("er"))
				|| (lemma.endsWith("um"))
				|| (lemma.endsWith("os"))
				|| (lemma.endsWith("ī"))
			) { return [2]; }
			if (lemma.endsWith("ū")) {
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
			return false;
		})()

		const getThirdDeclensionNonNeuterForms = () => {
			const posAcPlNonNeuterForms = (() => {
				if (hasIStem) {
					return joinStemsToEndings(stems, ['ēs', 'īs']);
				}
				return joinStemsToEndings(stems, 'ēs');
			})();

			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: joinStemsToEndings(stems, 'em'),
					genitive: joinStemsToEndings(stems, 'is'),
					dative: joinStemsToEndings(stems, 'ī'),
					ablative: joinStemsToEndings(stems, (hasIStem ? ['e', 'ī'] : 'e')),
					locative: joinStemsToEndings(stems, (hasLocativeSingular ? 'ī' : [])),
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ēs'),
					vocative: joinStemsToEndings(stems, 'ēs'),
					accusative: posAcPlNonNeuterForms,
					genitive: joinStemsToEndings(stems, (hasIStem || rest.IsDeclinedLikeAdjective ? 'ium' : 'um')),
					dative: joinStemsToEndings(stems, 'ibus'),
					ablative: joinStemsToEndings(stems, 'ibus'),
					locative: joinStemsToEndings(stems, (hasLocativePlural ? 'ibus' : [])),
				},
				possiblyIncorrect: joinStemsToEndings(stems, 'īs')
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
					locative: joinStemsToEndings(stems, (hasLocativeSingular ? 'ī' : [])),
				},
				plural: {
					nominative: joinStemsToEndings(stems, (hasIStem ? 'ia' : 'a')),
					vocative: joinStemsToEndings(stems, (hasIStem ? 'ia' : 'a')),
					accusative: joinStemsToEndings(stems, (hasIStem ? 'ia' : 'a')),
					genitive: joinStemsToEndings(stems, (hasIStem ? 'ium' : 'um')),
					dative: joinStemsToEndings(stems, 'ibus'),
					ablative: joinStemsToEndings(stems, 'ibus'),
					locative: joinStemsToEndings(stems, (hasLocativePlural ? 'ibus' : [])),
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
					locative: joinStemsToEndings(stems, (hasLocativeSingular ? 'ae' : [])),
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ae'),
					vocative: joinStemsToEndings(stems, 'ae'),
					accusative: joinStemsToEndings(stems, 'ās'),
					genitive: joinStemsToEndings(stems, 'ārum'),
					dative: joinStemsToEndings(stems, 'īs'),
					ablative: joinStemsToEndings(stems, 'īs'),
					locative: joinStemsToEndings(stems, (hasLocativePlural ? 'īs' : [])),
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
					locative: joinStemsToEndings(stems, (hasLocativeSingular ? 'ī' : [])),
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ī'),
					vocative: joinStemsToEndings(stems, 'ī'),
					accusative: joinStemsToEndings(stems, 'ōs'),
					genitive: joinStemsToEndings(stems, 'ōrum'),
					dative: joinStemsToEndings(stems, 'īs'),
					ablative: joinStemsToEndings(stems, 'īs'),
					locative: joinStemsToEndings(stems, (hasLocativePlural ? 'īs' : [])),
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
					locative: joinStemsToEndings(stems, (hasLocativeSingular ? 'ī' : [])),
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'a'),
					vocative: joinStemsToEndings(stems, 'a'),
					accusative: joinStemsToEndings(stems, 'a'),
					genitive: joinStemsToEndings(stems, 'ōrum'),
					dative: joinStemsToEndings(stems, 'īs'),
					ablative: joinStemsToEndings(stems, 'īs'),
					locative: joinStemsToEndings(stems, (hasLocativePlural ? 'īs' : [])),
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
					locative: joinStemsToEndings(stems, (hasLocativeSingular ? 'uī' : [])),
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ūs'),
					vocative: joinStemsToEndings(stems, 'ūs'),
					accusative: joinStemsToEndings(stems, 'ūs'),
					genitive: joinStemsToEndings(stems, 'uum'),
					dative: joinStemsToEndings(stems, 'ibus'),
					ablative: joinStemsToEndings(stems, 'ibus'),
					locative: joinStemsToEndings(stems, (hasLocativePlural ? 'ibus' : [])),
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
					locative: joinStemsToEndings(stems, (hasLocativeSingular ? 'ū' : []))
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ua'),
					vocative: joinStemsToEndings(stems, 'ua'),
					accusative: joinStemsToEndings(stems, 'ua'),
					genitive: joinStemsToEndings(stems, 'uum'),
					dative: joinStemsToEndings(stems, 'ibus'),
					ablative: joinStemsToEndings(stems, 'ibus'),
					locative: joinStemsToEndings(stems, (hasLocativePlural ? 'ibus' : [])),
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

		const replaced = replaceFieldsInObjects(forms, rest.ReplacementForms);
		const merged = mergeObjects(replaced, rest.ExtraForms)
		const wantedForms = deleteUnwantedForms(merged, rest.ParsingsToExclude);
		const withoutEmptyFields = deleteEmptyFields(wantedForms)
		const withEnclitics = multiplyWithEnclitics(withoutEmptyFields);
		return withEnclitics;
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

		else if (rest.Conjugations?.includes("sum")) {
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
			const prefix = lemma.replace(/ferō$/, '');
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
			const prefix = lemma.replace(/eō$/, '');
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
								first: ['ībār'],
								second: ['ībāris', 'ībāre'],
							},
							plural: {
								first: ['ībāmur'],
								second: ['ībāminī'],
								third: ['ībāntur']
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
					.map(form => form.replace(/ient/, 'eunt'))
					// Forms such as ‘abīvī’ should not exist.
					.filter(form => !form.includes('abīv'))
			);
		}

		if (rest.Conjugations?.length > 1) {
			console.warn(`Verb ${Lemma} may be misconjugated because its conjugations are given as `, rest.Conjugations);
		}

		if (JSON.stringify(forms)==='{}') {
			return {}
		}

		const replaced = replaceFieldsInObjects(forms, rest.ReplacementForms);
		const merged = mergeObjects(replaced, rest.ExtraForms)
		const wantedForms = deleteUnwantedForms(merged, rest.ParsingsToExclude);
		const withoutEmptyFields = deleteEmptyFields(wantedForms)
		const withEnclitics = multiplyWithEnclitics(withoutEmptyFields);
		return withEnclitics;
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
							if ([...expectedOutput[lemma]].some(form => form.endsWith('āns'))) {
								// console.log('Possible first conjugation: ', lemma);
							}
							else if (/iō(\[[^\]]+\])?$/.test(lemma) && [...expectedOutput[lemma]].every(form => !form.endsWith('ere')) && [...expectedOutput[lemma]].every(form => !form.endsWith('faciō'))) {
								// console.log('Possible fourth conjugation: ', lemma);
							}
							else if (/eō(\[[^\]]+\])?$/.test(lemma) && [...expectedOutput[lemma]].every(form => !form.endsWith('īre')) && [...expectedOutput[lemma]].every(form => !form.endsWith('iēns'))) {
								// console.log('Possible second conjugation: ', lemma);
							}
							else if (/(?<!grad|gred|mor)ior(\[[^\]]+\])?$/.test(lemma) && [...expectedOutput[lemma]].every(form => !form.endsWith('ere')) && [...expectedOutput[lemma]].every(form => !form.endsWith('iāns'))) {
								// console.log('Possible fourth conjugation: ', lemma);
							}
							else if (/eō(\[[^\]]+\])?$/.test(lemma) && [...expectedOutput[lemma]].every(form => !form.endsWith('īre')) && [...expectedOutput[lemma]].every(form => !form.endsWith('iēns'))) {
								// console.log('Possible second conjugation: ', lemma);
							}
							else if (/eor(\[[^\]]+\])?$/.test(lemma) && [...expectedOutput[lemma]].every(form => !form.endsWith('iēns'))) {
								// console.log('Possible second conjugation: ', lemma);
							}
							else if ([...expectedOutput[lemma]].some(form => form.endsWith('ere'))) {
								// console.log('Possible third conjugation: ', lemma);
							}
							else if (/or(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Deponent: ', lemma);
							}
							else if (/(āscō|ēscō|īscō)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Possible third conjugation (inchoative): ', lemma);
							}
							else if (/(faciō)(\[[^\]]+\])?$/.test(lemma)) {
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
							else if (/(ō|t)(\[[^\]]+\])?$/.test(lemma)) {
								// console.log('Unknown conjugation: ', lemma);
							}
							else if (!['inquam', 'coepī', 'meminī', 'ōdī', 'potin', 'laecasīn', 'cum[v]'].includes(lemma)) {
								console.log('Might not be a verb: ', lemma);
							}
							else {
								// console.log('Unknown conjugation: ', lemma);
							}
							continue;
						}

						if (expectedOutput[lemma] === undefined) {
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
							// console.log({parsingData})
							const comparativeForm = parsingData.unencliticized?.comparative?.neuter?.singular?.nominative?.[0]
								?? parsingData.unencliticized?.comparative?.[0];
							if (comparativeForm) {
								if (!expectedFormsAsSet.has(comparativeForm)) {
									const lemmataToNotComplainAboutComparativesFor = [
										"iūrisperītus", "celeriter", "sērus", "posterus", "novus", "nōtus", "multus", "lūcidus", "limpidus", "inīquus", "grātus", "fīdus", "falsus", "aptus", "noviter", "altus", "inter", "citer", "fortis", "piger", "similis", "efficāx", "adrogāns", "āctuōsus"
									];
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
