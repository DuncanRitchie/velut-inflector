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
	if (parsingObject.unencliticized) {
		return parsingObject;
	}

	const addEnclitic = (object, enclitic) => {
		try {
			if (!object) {
				console.warn(`parsingObject is ${object} in addEnclitic`);
				return {};
			}
			if (Array.isArray(object)) {
				return object.map(form => {
					if (form.endsWith('c') && addIAfterC && enclitic === 'ne') {
						return form + 'i' + enclitic;
					}
					return form + enclitic;
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

const ensureIsArray = (possibleArray) => {
	return Array.isArray(possibleArray) ? possibleArray : [possibleArray];
}

const joinStemsToEndings = (stems, endings) => {
	const stemsArray = ensureIsArray(stems);
	const endingsArray = ensureIsArray(endings);
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
			const withQueLemmaHandled = markQueAsUnencliticized(withEnclitics, rest.IsLemmaInQue);
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
				if (lemma.endsWith('um')) {
					console.log(`Assuming neuter for ${Lemma}`)
					return ["neuter"];
				}
				console.log(`Assuming masculine for ${Lemma}`)
				return ["masculine"];
			}
			if (lemma.endsWith('n')) {
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

		if (rest.IsIndeclinable) {
			const forms = {}
			genders.forEach(gender => {
				forms[gender] = ({
					singular: {
						nominative: [lemma],
						vocative: [lemma],
						accusative: [lemma],
						genitive: [lemma],
						dative: [lemma],
						ablative: [lemma]
					}
				});
			});
			return multiplyWithEnclitics(forms)
		}



		const assumedStem = (() => {
			const lemmaSuffixesAndOblique = [
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
				[/ys$/, ''],
			];
			for (tuple of lemmaSuffixesAndOblique) {
				const [regex, ending] = tuple;
				if (regex.test(lemma)) {
					return lemma.replace(regex, ending);
				}
			}
			return lemma;
		})()

		const stems = rest.ObliqueStems ?? [assumedStem];

		const hasIStem = (() => {
			if (rest.HasIStem === true || rest.HasIStem === false) {
				return rest.HasIStem;
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
					ablative: joinStemsToEndings(stems, 'e'),
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'ēs'),
					vocative: joinStemsToEndings(stems, 'ēs'),
					accusative: posAcPlNonNeuterForms,
					genitive: joinStemsToEndings(stems, (hasIStem || rest.IsDeclinedLikeAdjective ? 'ium' : 'um')),
					dative: joinStemsToEndings(stems, 'ibus'),
					ablative: joinStemsToEndings(stems, 'ibus'),
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
				},
				plural: {
					nominative: joinStemsToEndings(stems, (hasIStem ? 'ia' : 'a')),
					vocative: joinStemsToEndings(stems, (hasIStem ? 'ia' : 'a')),
					accusative: joinStemsToEndings(stems, (hasIStem ? 'ia' : 'a')),
					genitive: joinStemsToEndings(stems, (hasIStem ? 'ium' : 'um')),
					dative: joinStemsToEndings(stems, 'ibus'),
					ablative: joinStemsToEndings(stems, 'ibus'),
				},
			};
		}

		let forms = {};

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


		if (JSON.stringify(forms)==='{}') {
			return {}
		}

		const replaced = replaceFieldsInObjects(forms, rest.ReplacementForms);
		const merged = mergeObjects(replaced, rest.ExtraForms)
		const withEnclitics = multiplyWithEnclitics(merged);
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
		return {};
	},
	"Verb": ({Lemma, PartOfSpeech, ...rest}) => {
		return {};
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
