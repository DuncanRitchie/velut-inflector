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

// Eg, pl??rusque is a [1,2]-declension adjective with -que suffixed
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
		.replaceAll('???', '??')
		// More `replaceAll` calls may need to be added here.
		;
}

const ensureIsArray = (possibleArray) => {
	return Array.isArray(possibleArray) ? possibleArray : [possibleArray];
}

//// Returns an array with all the values of `stems`
//// concatenated with all the values of `endings`.
//// Adds diaereses if needed so that 'Tana' + 'e' => 'Tana??'
//// but 'Tana' + 'em' => 'Tanaem'.
//// (The velut Word Data Generator interprets final vowel+'m' as nasalised
//// before it interprets 'ae'/'au'/'oe' as a diphthong, which means that
//// non-diphthong 'ae'/'au'/'oe' doesn???t need the diaeresis if it???s before final 'm'.)
const joinStemsToEndings = (stems, endings) => {
	const stemsArray = ensureIsArray(stems);
	const endingsArray = ensureIsArray(endings);
	return stemsArray.flatMap(stem => {
		return endingsArray.map(ending => {
			return (stem + '~' + ending)
				.replace(/a~e(?!m$)/, 'a??')
				.replace(/a~u(?!m$)/, 'a??')
				.replace(/o~e(?!m$)/, 'o??')
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
				accusative: joinStemsToEndings(comparativeStems, '??rem'),
				genitive: joinStemsToEndings(comparativeStems, '??ris'),
				dative: joinStemsToEndings(comparativeStems, '??r??'),
				ablative: joinStemsToEndings(comparativeStems, '??re'),
			},
			plural: {
				nominative: joinStemsToEndings(comparativeStems, '??r??s'),
				vocative: joinStemsToEndings(comparativeStems, '??r??s'),
				accusative: joinStemsToEndings(comparativeStems, ['??r??s', '??r??s']),
				genitive: joinStemsToEndings(comparativeStems, '??rum'),
				dative: joinStemsToEndings(comparativeStems, '??ribus'),
				ablative: joinStemsToEndings(comparativeStems, '??ribus'),
			},
		},
		feminine: {
			singular: {
				nominative: joinStemsToEndings(comparativeStems, 'or'),
				vocative: joinStemsToEndings(comparativeStems, 'or'),
				accusative: joinStemsToEndings(comparativeStems, '??rem'),
				genitive: joinStemsToEndings(comparativeStems, '??ris'),
				dative: joinStemsToEndings(comparativeStems, '??r??'),
				ablative: joinStemsToEndings(comparativeStems, '??re'),
			},
			plural: {
				nominative: joinStemsToEndings(comparativeStems, '??r??s'),
				vocative: joinStemsToEndings(comparativeStems, '??r??s'),
				accusative: joinStemsToEndings(comparativeStems, ['??r??s', '??r??s']),
				genitive: joinStemsToEndings(comparativeStems, '??rum'),
				dative: joinStemsToEndings(comparativeStems, '??ribus'),
				ablative: joinStemsToEndings(comparativeStems, '??ribus'),
			},
		},
		neuter: {
			singular: {
				nominative: joinStemsToEndings(comparativeStems, 'us'),
				vocative: joinStemsToEndings(comparativeStems, 'us'),
				accusative: joinStemsToEndings(comparativeStems, 'us'),
				genitive: joinStemsToEndings(comparativeStems, '??ris'),
				dative: joinStemsToEndings(comparativeStems, '??r??'),
				ablative: joinStemsToEndings(comparativeStems, '??re'),
			},
			plural: {
				nominative: joinStemsToEndings(comparativeStems, '??ra'),
				vocative: joinStemsToEndings(comparativeStems, '??ra'),
				accusative: joinStemsToEndings(comparativeStems, '??ra'),
				genitive: joinStemsToEndings(comparativeStems, '??rum'),
				dative: joinStemsToEndings(comparativeStems, '??ribus'),
				ablative: joinStemsToEndings(comparativeStems, '??ribus'),
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
				genitive: joinStemsToEndings(superlativeStems, '??'),
				dative: joinStemsToEndings(superlativeStems, '??'),
				ablative: joinStemsToEndings(superlativeStems, '??'),
			},
			plural: {
				nominative: joinStemsToEndings(superlativeStems, '??'),
				vocative: joinStemsToEndings(superlativeStems, '??'),
				accusative: joinStemsToEndings(superlativeStems, '??s'),
				genitive: joinStemsToEndings(superlativeStems, '??rum'),
				dative: joinStemsToEndings(superlativeStems, '??s'),
				ablative: joinStemsToEndings(superlativeStems, '??s'),
			},
		},
		feminine: {
			singular: {
				nominative: joinStemsToEndings(superlativeStems, 'a'),
				vocative: joinStemsToEndings(superlativeStems, 'a'),
				accusative: joinStemsToEndings(superlativeStems, 'am'),
				genitive: joinStemsToEndings(superlativeStems, 'ae'),
				dative: joinStemsToEndings(superlativeStems, 'ae'),
				ablative: joinStemsToEndings(superlativeStems, '??'),
			},
			plural: {
				nominative: joinStemsToEndings(superlativeStems, 'ae'),
				vocative: joinStemsToEndings(superlativeStems, 'ae'),
				accusative: joinStemsToEndings(superlativeStems, '??s'),
				genitive: joinStemsToEndings(superlativeStems, '??rum'),
				dative: joinStemsToEndings(superlativeStems, '??s'),
				ablative: joinStemsToEndings(superlativeStems, '??s'),
			},
		},
		neuter: {
			singular: {
				nominative: joinStemsToEndings(superlativeStems, 'um'),
				vocative: joinStemsToEndings(superlativeStems, 'um'),
				accusative: joinStemsToEndings(superlativeStems, 'um'),
				genitive: joinStemsToEndings(superlativeStems, '??'),
				dative: joinStemsToEndings(superlativeStems, '??'),
				ablative: joinStemsToEndings(superlativeStems, '??'),
			},
			plural: {
				nominative: joinStemsToEndings(superlativeStems, 'a'),
				vocative: joinStemsToEndings(superlativeStems, 'a'),
				accusative: joinStemsToEndings(superlativeStems, 'a'),
				genitive: joinStemsToEndings(superlativeStems, '??rum'),
				dative: joinStemsToEndings(superlativeStems, '??s'),
				ablative: joinStemsToEndings(superlativeStems, '??s'),
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
				|| (lemma.endsWith("??s"))
				|| (lemma.endsWith("er"))
				|| (lemma.endsWith("a"))
				|| (lemma.endsWith("??"))
			) ? "[1,2]"
				: "[3]";

		//// 1st/2nd-declension adjectives
		if (declensionsString === "[1,2]") {
			const stems = ensureIsArray((() => {
				if (rest.ObliqueStems) { return rest.ObliqueStems; }
				if (lemma.endsWith('er')) { return lemma; }
				if (lemma.endsWith('a') | lemma.endsWith('??')) { return lemma.substring(0, lemma.length - 1); }
				return lemma.substring(0, lemma.length - 2);
			})());
			const comparativeStems = rest.ComparativeStems || joinStemsToEndings(stems, "i");
			const superlativeStems = rest.SuperlativeStems
				|| (lemma.endsWith('er')
					? joinStemsToEndings(lemma, 'rim')
					: joinStemsToEndings(stems, 'issim'));

			//// Eg S??d??nius => S??d??ni??, S??d??n??
			const getPositiveMasculineSingularGenitiveForms = () => {
				const mappedStems = stems.map(stem => {
					const uncontracted = joinStemsToEndings(stem, '??');
					const contracted = stem.substring(0, stems[0].length - 1) + '??';
					const contractedWithAcute = contracted
						.replace(/a(?=[bcdfglmnprstv]??$)/, '??')
						.replace(/e(?=[bcdfglmnprstv]??$)/, '??')
						.replace(/i(?=[bcdfglmnprstv]??$)/, '??')
						.replace(/o(?=[bcdfglmnprstv]??$)/, '??')
						.replace(/u(?=[bcdfglmnprstv]??$)/, '??')
						.replace(/y(?=[bcdfglmnprstv]??$)/, '??')
					if (stem.endsWith('i') || stem.endsWith("??")) {
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
							vocative: joinStemsToEndings(stems, (stems[0].endsWith('a') ? '??' : 'e')),
							accusative: joinStemsToEndings(stems, 'um'),
							genitive: getPositiveMasculineSingularGenitiveForms(),
							dative: joinStemsToEndings(stems, '??'),
							ablative: joinStemsToEndings(stems, '??'),
						},
						plural: {
							nominative: joinStemsToEndings(stems, '??'),
							vocative: joinStemsToEndings(stems, '??'),
							accusative: joinStemsToEndings(stems, '??s'),
							genitive: joinStemsToEndings(stems, '??rum'),
							dative: joinStemsToEndings(stems, '??s'),
							ablative: joinStemsToEndings(stems, '??s'),
						},
					},
					feminine: {
						singular: {
							nominative: joinStemsToEndings(stems, 'a'),
							vocative: joinStemsToEndings(stems, 'a'),
							accusative: joinStemsToEndings(stems, 'am'),
							genitive: joinStemsToEndings(stems, 'ae'),
							dative: joinStemsToEndings(stems, 'ae'),
							ablative: joinStemsToEndings(stems, '??'),
						},
						plural: {
							nominative: joinStemsToEndings(stems, 'ae'),
							vocative: joinStemsToEndings(stems, 'ae'),
							accusative: joinStemsToEndings(stems, '??s'),
							genitive: joinStemsToEndings(stems, '??rum'),
							dative: joinStemsToEndings(stems, '??s'),
							ablative: joinStemsToEndings(stems, '??s'),
						},
					},
					neuter: {
						singular: {
							nominative: joinStemsToEndings(stems, 'um'),
							vocative: joinStemsToEndings(stems, 'um'),
							accusative: joinStemsToEndings(stems, 'um'),
							genitive: joinStemsToEndings(stems, '??'),
							dative: joinStemsToEndings(stems, '??'),
							ablative: joinStemsToEndings(stems, '??'),
						},
						plural: {
							nominative: joinStemsToEndings(stems, 'a'),
							vocative: joinStemsToEndings(stems, 'a'),
							accusative: joinStemsToEndings(stems, 'a'),
							genitive: joinStemsToEndings(stems, '??rum'),
							dative: joinStemsToEndings(stems, '??s'),
							ablative: joinStemsToEndings(stems, '??s'),
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
			if (lemma.endsWith('??ns')) {
				return lemma.replace(/??ns$/, 'ant');
			}
			if (lemma.endsWith('??ns')) {
				return lemma.replace(/??ns$/, 'ent');
			}
			if (lemma.endsWith('??ns')) {
				return lemma.replace(/??ns$/, 'ont');
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
			if (lemma.endsWith('??lis')) { return true; }
			if (lemma.endsWith('??lis')) { return true; }
			if (lemma.endsWith('??lis')) { return true; }
			if (lemma.endsWith('??lis')) { return true; }
			if (lemma.endsWith('ns')) { return true; }
			if (lemma.endsWith('??nsis')) { return true; }
			if (lemma.endsWith('guis')) { return true; }
			if (lemma.endsWith('quis')) { return true; }
			if (stems[0].endsWith('r')) { return true; }
			if (lemma.endsWith('x')) { return true; }
			return false;
		})();

		const posAcPlNonNeuterForms = (() => {
			if (hasIStem) {
				return joinStemsToEndings(stems, ['??s', '??s']);
			}
			return joinStemsToEndings(stems, '??s');
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
						dative: joinStemsToEndings(stems, '??'),
						ablative: joinStemsToEndings(stems, (hasIStem ? '??' : 'e')),
					},
					plural: {
						nominative: joinStemsToEndings(stems, '??s'),
						vocative: joinStemsToEndings(stems, '??s'),
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
						dative: joinStemsToEndings(stems, '??'),
						ablative: joinStemsToEndings(stems, (hasIStem ? '??' : 'e')),
					},
					plural: {
						nominative: joinStemsToEndings(stems, '??s'),
						vocative: joinStemsToEndings(stems, '??s'),
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
						dative: joinStemsToEndings(stems, '??'),
						ablative: joinStemsToEndings(stems, (hasIStem ? '??' : 'e')),
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
		const stems = rest.ObliqueStems || [positive.replace(/(??|iter|(?<=c)ter|er|im|om|um|??|e|??)$/, "")];

		if (rest.IsIndeclinable
			|| positive === stems[0]
			|| (!rest.ObliqueStems && (positive.endsWith("??tim") || positive.endsWith("??tim")))
		) {
			if (rest.IsIndeclinable) {
				// For adverbs, `IsIndeclinable: true` is a less correct property than `ParsingsToExclude: ["comparative", "superlative"]`
				// although the two properties are treated the same.
				console.warn(`Adverb marked as indeclinable: ${Lemma}`);
			}
			return multiplyWithEnclitics({positive: [positive]});
		}

		const comparatives = stems.map(stem => stem + "ius");
		const superlatives = stems.map(stem => (/[bce]r$/.test(stem) ? stem.replace(/e?r$/, "errim??") : stem + "issim??"));
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
			if (Lemma.endsWith("??rum]")) {
				console.log(`Assuming 2nd declension for ${Lemma}`)
				return [2];
			}
			if (lemma.endsWith("a")) {
				console.log(`Assuming 1st declension for ${Lemma}`)
				return [1];
			}
			if (lemma.endsWith("??")) {
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
				|| (lemma.endsWith("??"))
			) { return [2]; }
			if (lemma.endsWith("??")) {
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
			if (lemma.endsWith('??n')) {
				console.log(`Assuming masculine for ${Lemma}`)
				return ["masculine"]
			}
			if (lemma.endsWith('on')) {
				console.log(`Assuming neuter for ${Lemma}`)
				return ["neuter"]
			}
			if (lemma.endsWith('??')) {
				console.log(`Assuming feminine for ${Lemma}`)
				return ["feminine"]
			}
			if (lemma.endsWith('i??')) {
				console.log(`Assuming feminine for ${Lemma}`)
				return ["feminine"]
			}
			if (lemma.endsWith('t??d??')) {
				console.log(`Assuming feminine for ${Lemma}`)
				return ["feminine"]
			}
			if (lemma.endsWith('??s')) {
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
			if (lemma.endsWith('??s')) {
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
				[/al$/, '??l'],
				[/ar$/, '??r'],
				[/??ns$/, 'ant'],
				[/as$/, 'ad'],
				[/??s$/, '??t'],
				[/(?<=[bp])s$/, ''],
				[/e$/, ''],
				[/en$/, 'in'],
				[/??ns$/, 'ent'],
				[/(?<!a)es$/, 'it'],
				[/??s$/, ''],
				[/(?<!a)ex$/, 'ic'],
				[/x$/, 'c'],
				[/ia$/, ''],
				[/a$/, ''],
				[/??g??$/, '??gin'],
				[/is$/, ''],
				[/??d??$/, '??din'],
				[/t??d??$/, 't??din'],
				[/??$/, '??n'],
				[/??n$/, 'on'],
				[/??ns$/, 'ont'],
				[/or$/, '??r'],
				[/??s$/, '??t'],
				[/ys$/, 'y'],
			];
			const nonThirdDeclLemmaSuffixesAndOblique = [
				[/a$/, ''],
				[/ae$/, ''],
				[/??s$/, ''],
				[/??$/, ''],
				[/??s$/, ''],
				[/??$/, ''],
				[/??$/, ''],
				[/on$/, ''],
				[/os$/, ''],
				[/um$/, ''],
				[/us$/, ''],
				[/??s$/, ''],
				[/??$/, ''],
				[/??s$/, ''],
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
			if (lemma.endsWith('??nsis')) {
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
					return joinStemsToEndings(stems, ['??s', '??s']);
				}
				return joinStemsToEndings(stems, '??s');
			})();

			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: joinStemsToEndings(stems, 'em'),
					genitive: joinStemsToEndings(stems, 'is'),
					dative: joinStemsToEndings(stems, '??'),
					ablative: joinStemsToEndings(stems, (hasIStem ? ['e', '??'] : 'e')),
					locative: joinStemsToEndings(stems, (hasLocativeSingular ? '??' : [])),
				},
				plural: {
					nominative: joinStemsToEndings(stems, '??s'),
					vocative: joinStemsToEndings(stems, '??s'),
					accusative: posAcPlNonNeuterForms,
					genitive: joinStemsToEndings(stems, (hasIStem || rest.IsDeclinedLikeAdjective ? 'ium' : 'um')),
					dative: joinStemsToEndings(stems, 'ibus'),
					ablative: joinStemsToEndings(stems, 'ibus'),
					locative: joinStemsToEndings(stems, (hasLocativePlural ? 'ibus' : [])),
				},
				possiblyIncorrect: joinStemsToEndings(stems, '??s')
			}
		}
		const getThirdDeclensionNeuterForms = () => {
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: joinStemsToEndings(stems, 'e'),
					genitive: joinStemsToEndings(stems, 'is'),
					dative: joinStemsToEndings(stems, '??'),
					ablative: joinStemsToEndings(stems, (hasIStem ? '??' : 'e')),
					locative: joinStemsToEndings(stems, (hasLocativeSingular ? '??' : [])),
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
				return lemma.endsWith('??s') || lemma.endsWith('??');
			})();
			const isGreekFirstDeclensionA = isGreekFirstDeclension && lemma.endsWith('??s');
			const isGreekFirstDeclensionE = isGreekFirstDeclension && !lemma.endsWith('??s');
			const accSingEnding = isGreekFirstDeclensionE
				? '??n'
				: isGreekFirstDeclensionA
					? '??n'
					: 'am';
			const genSingEnding = isGreekFirstDeclensionE ? '??s' : 'ae';
			const ablSingEnding = isGreekFirstDeclensionE ? '??' : '??';
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
					accusative: joinStemsToEndings(stems, '??s'),
					genitive: joinStemsToEndings(stems, '??rum'),
					dative: joinStemsToEndings(stems, '??s'),
					ablative: joinStemsToEndings(stems, '??s'),
					locative: joinStemsToEndings(stems, (hasLocativePlural ? '??s' : [])),
				},
			};
		}
		const getSecondDeclensionNonNeuterForms = () => {
			//// Note on vocatives for -ius nouns:
			//// Proper nouns that end in -ius (& f??lius, genius) should have vocative masculine singular in -??.
			//// (Exceptions include some Greek names that have vocative masculine singular in iota epsilon in Greek.)
			//// Adjectives, and all other nouns, should have vocative masculine singular in -ie.
			//// (However, before imperial times, -ie forms were avoided, and sometimes -?? forms were used instead.)
			//// Source: https://ore.exeter.ac.uk/repository/bitstream/handle/10036/65307/DickeyOEgregie.pdf
			const nonProperNounVocSings = joinStemsToEndings(stems, 'e')
				.map(form => form.replace(/ae$/, 'a??').replace(/oe$/, 'o??'));
			const vocSings = PartOfSpeech === "Proper noun"
				? nonProperNounVocSings.map(form => form.replace(/[i??]e$/, '??'))
				: nonProperNounVocSings;

			const regularGenSings = joinStemsToEndings(stems, '??');
			const genSings = regularGenSings.flatMap(form => {
				if (form.endsWith('i??') || form.endsWith('????')) {
					return [form, form.replace(/[i??]??$/, '??')];
				}
				return [form];
			});

			return {
				singular: {
					nominative: [lemma],
					vocative: vocSings,
					accusative: joinStemsToEndings(stems, 'um'),
					genitive: genSings,
					dative: joinStemsToEndings(stems, '??'),
					ablative: joinStemsToEndings(stems, '??'),
					locative: joinStemsToEndings(stems, (hasLocativeSingular ? '??' : [])),
				},
				plural: {
					nominative: joinStemsToEndings(stems, '??'),
					vocative: joinStemsToEndings(stems, '??'),
					accusative: joinStemsToEndings(stems, '??s'),
					genitive: joinStemsToEndings(stems, '??rum'),
					dative: joinStemsToEndings(stems, '??s'),
					ablative: joinStemsToEndings(stems, '??s'),
					locative: joinStemsToEndings(stems, (hasLocativePlural ? '??s' : [])),
				},
			};
		}
		const getSecondDeclensionNeuterForms = () => {
			const regularGenSings = joinStemsToEndings(stems, '??');
			const genSings = regularGenSings.flatMap(form => {
				if (form.endsWith('i??')) {
					return [form, form.replace(/i??$/, '??')];
				}
				return [form];
			});
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: [lemma],
					genitive: genSings,
					dative: joinStemsToEndings(stems, '??'),
					ablative: joinStemsToEndings(stems, '??'),
					locative: joinStemsToEndings(stems, (hasLocativeSingular ? '??' : [])),
				},
				plural: {
					nominative: joinStemsToEndings(stems, 'a'),
					vocative: joinStemsToEndings(stems, 'a'),
					accusative: joinStemsToEndings(stems, 'a'),
					genitive: joinStemsToEndings(stems, '??rum'),
					dative: joinStemsToEndings(stems, '??s'),
					ablative: joinStemsToEndings(stems, '??s'),
					locative: joinStemsToEndings(stems, (hasLocativePlural ? '??s' : [])),
				},
			};
		}
		const getFourthDeclensionNonNeuterForms = () => {
			return {
				singular: {
					nominative: [lemma],
					vocative: [lemma],
					accusative: joinStemsToEndings(stems, 'um'),
					genitive: joinStemsToEndings(stems, '??s'),
					dative: joinStemsToEndings(stems, 'u??'),
					ablative: joinStemsToEndings(stems, '??'),
					locative: joinStemsToEndings(stems, (hasLocativeSingular ? 'u??' : [])),
				},
				plural: {
					nominative: joinStemsToEndings(stems, '??s'),
					vocative: joinStemsToEndings(stems, '??s'),
					accusative: joinStemsToEndings(stems, '??s'),
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
					genitive: joinStemsToEndings(stems, '??s'),
					dative: joinStemsToEndings(stems, '??'),
					ablative: joinStemsToEndings(stems, '??'),
					locative: joinStemsToEndings(stems, (hasLocativeSingular ? '??' : []))
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
					genitive: joinStemsToEndings(stems, '????'),
					dative: joinStemsToEndings(stems, '????'),
					ablative: joinStemsToEndings(stems, '??'),
				},
				plural: {
					nominative: joinStemsToEndings(stems, '??s'),
					vocative: joinStemsToEndings(stems, '??s'),
					accusative: joinStemsToEndings(stems, '??s'),
					genitive: joinStemsToEndings(stems, '??rum'),
					dative: joinStemsToEndings(stems, '??bus'),
					ablative: joinStemsToEndings(stems, '??bus'),
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
					console.warn('I don???t know how to handle this 1st-declension neuter noun: ' + Lemma)
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
					console.warn('I don???t know how to handle this 5th-declension neuter noun: ' + Lemma)
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
		// Pronouns are hardcoded, so there???s not much for the Inflector to do.
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
			|| lemma.endsWith('v??s'))
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
		//// (They differ in their vocative singular if they end in ???-ius???,
		//// but this is handled inside the Noun function.)
		return inflectFuncs["Noun"]({ Lemma, PartOfSpeech, ...rest });
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
	clearOutputObject(); // Clear the output in case there???s anything from previous runs.
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
				`Error when processing lemma ${i} (${lemma.Lemma}) ??? ${error}`
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

		//// Input data look like "voc??bul??rum\tvoc??bulum\rexcellentium\texcell??ns excell??\r"
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
							//// The Inflector returns {} for lemmata it doesn???t know
							//// how to inflect, so there are no forms to compare here.
							//// These lemmata will be counted as ???skipped???.
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
										"i??risper??tus", "celeriter", "s??rus", "posterus", "novus", "n??tus", "multus", "l??cidus", "limpidus", "in??quus", "gr??tus", "f??dus", "falsus", "aptus", "noviter", "altus", "inter", "citer", "fortis", "piger", "similis", "effic??x", "adrog??ns", "??ctu??sus"
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
