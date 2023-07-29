const buttonTest = document.getElementById('test');

//// Data to use in tests:

const tests = [
	{
		Input: {
			"Lemma": "ā",
			"PartOfSpeech": "Noun",
			"Meanings": "letter Aa",
			"Genders": ["neuter"],
			"Declensions": [0],
		},
		Expected: {
			"unencliticized": {
				"neuter": {
					"singular": {
						"nominative": ["ā"],
						"vocative": ["ā"],
						"accusative": ["ā"],
						"genitive": ["ā"],
						"dative": ["ā"],
						"ablative": ["ā"]
					}
				}
			},
			"ne": {
				"neuter": {
					"singular": {
						"nominative": ["āne"],
						"vocative": ["āne"],
						"accusative": ["āne"],
						"genitive": ["āne"],
						"dative": ["āne"],
						"ablative": ["āne"]
					}
				}
			},
			"que": {
				"neuter": {
					"singular": {
						"nominative": ["āque"],
						"vocative": ["āque"],
						"accusative": ["āque"],
						"genitive": ["āque"],
						"dative": ["āque"],
						"ablative": ["āque"]
					}
				}
			},
			"ve": {
				"neuter": {
					"singular": {
						"nominative": ["āve"],
						"vocative": ["āve"],
						"accusative": ["āve"],
						"genitive": ["āve"],
						"dative": ["āve"],
						"ablative": ["āve"]
					}
				}
			},
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
			"Lemma": "abavia",
			"PartOfSpeech": "Noun",
			"Meanings": "great-great-grandmother",
			"Declensions": [1],
			"Genders": ["feminine"],
		},
		Expected: {
			"unencliticized": {
				"feminine": {
					"singular": {
						"nominative": ["abavia"],
						"vocative": ["abavia"],
						"accusative": ["abaviam"],
						"genitive": ["abaviae"],
						"dative": ["abaviae"],
						"ablative": ["abaviā"]
					},
					"plural": {
						"nominative": ["abaviae"],
						"vocative": ["abaviae"],
						"accusative": ["abaviās"],
						"genitive": ["abaviārum"],
						"dative": ["abaviīs"],
						"ablative": ["abaviīs"]
					}
				}
			},
			"ne": {
				"feminine": {
					"singular": {
						"nominative": ["abaviane"],
						"vocative": ["abaviane"],
						"accusative": ["abaviamne"],
						"genitive": ["abaviaene"],
						"dative": ["abaviaene"],
						"ablative": ["abaviāne"]
					},
					"plural": {
						"nominative": ["abaviaene"],
						"vocative": ["abaviaene"],
						"accusative": ["abaviāsne"],
						"genitive": ["abaviārumne"],
						"dative": ["abaviīsne"],
						"ablative": ["abaviīsne"]
					}
				}
			},
			"que": {
				"feminine": {
					"singular": {
						"nominative": ["abaviaque"],
						"vocative": ["abaviaque"],
						"accusative": ["abaviamque"],
						"genitive": ["abaviaeque"],
						"dative": ["abaviaeque"],
						"ablative": ["abaviāque"]
					},
					"plural": {
						"nominative": ["abaviaeque"],
						"vocative": ["abaviaeque"],
						"accusative": ["abaviāsque"],
						"genitive": ["abaviārumque"],
						"dative": ["abaviīsque"],
						"ablative": ["abaviīsque"]
					}
				}
			},
			"ve": {
				"feminine": {
					"singular": {
						"nominative": ["abaviave"],
						"vocative": ["abaviave"],
						"accusative": ["abaviamve"],
						"genitive": ["abaviaeve"],
						"dative": ["abaviaeve"],
						"ablative": ["abaviāve"]
					},
					"plural": {
						"nominative": ["abaviaeve"],
						"vocative": ["abaviaeve"],
						"accusative": ["abaviāsve"],
						"genitive": ["abaviārumve"],
						"dative": ["abaviīsve"],
						"ablative": ["abaviīsve"]
					}
				}
			}
		},
	},
	{
		Input: {
			"Lemma": "abavus",
			"PartOfSpeech": "Noun",
			"Meanings": "great-great-grandfather",
			"Declensions": [2],
			"Genders": ["masculine"]
		},
		Expected: {
			"unencliticized": {
				"masculine": {
					"singular": {
						"nominative": ["abavus"],
						"vocative": ["abave"],
						"accusative": ["abavum"],
						"genitive": ["abavī"],
						"dative": ["abavō"],
						"ablative": ["abavō"]
					},
					"plural": {
						"nominative": ["abavī"],
						"vocative": ["abavī"],
						"accusative": ["abavōs"],
						"genitive": ["abavōrum"],
						"dative": ["abavīs"],
						"ablative": ["abavīs"]
					}
				}
			},
			"ne": {
				"masculine": {
					"singular": {
						"nominative": ["abavusne"],
						"vocative": ["abavene"],
						"accusative": ["abavumne"],
						"genitive": ["abavīne"],
						"dative": ["abavōne"],
						"ablative": ["abavōne"]
					},
					"plural": {
						"nominative": ["abavīne"],
						"vocative": ["abavīne"],
						"accusative": ["abavōsne"],
						"genitive": ["abavōrumne"],
						"dative": ["abavīsne"],
						"ablative": ["abavīsne"]
					}
				}
			},
			"que": {
				"masculine": {
					"singular": {
						"nominative": ["abavusque"],
						"vocative": ["abaveque"],
						"accusative": ["abavumque"],
						"genitive": ["abavīque"],
						"dative": ["abavōque"],
						"ablative": ["abavōque"]
					},
					"plural": {
						"nominative": ["abavīque"],
						"vocative": ["abavīque"],
						"accusative": ["abavōsque"],
						"genitive": ["abavōrumque"],
						"dative": ["abavīsque"],
						"ablative": ["abavīsque"]
					}
				}
			},
			"ve": {
				"masculine": {
					"singular": {
						"nominative": ["abavusve"],
						"vocative": ["abaveve"],
						"accusative": ["abavumve"],
						"genitive": ["abavīve"],
						"dative": ["abavōve"],
						"ablative": ["abavōve"]
					},
					"plural": {
						"nominative": ["abavīve"],
						"vocative": ["abavīve"],
						"accusative": ["abavōsve"],
						"genitive": ["abavōrumve"],
						"dative": ["abavīsve"],
						"ablative": ["abavīsve"]
					}
				}
			}
		},
	},
	{
		Input: {
			"Lemma": "abdicō",
			"PartOfSpeech": "Verb",
			"Meanings": "deny; abdicate; renounce",
			"Conjugations": [1],
		},
		Expected: {
			"unencliticized": {
				"indicative": {
					"active": {
						"present": {
							"singular": {
								"first": ["abdicō"],
								"second": ["abdicās"],
								"third": ["abdicat"]
							},
							"plural": {
								"first": ["abdicāmus"],
								"second": ["abdicātis"],
								"third": ["abdicant"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdicābam"],
								"second": ["abdicābās"],
								"third": ["abdicābat"]
							},
							"plural": {
								"first": ["abdicābāmus"],
								"second": ["abdicābātis"],
								"third": ["abdicābant"]
							}
						},
						"future": {
							"singular": {
								"first": ["abdicābō"],
								"second": ["abdicābis"],
								"third": ["abdicābit"]
							},
							"plural": {
								"first": ["abdicābimus"],
								"second": ["abdicābitis"],
								"third": ["abdicābunt"]
							}
						},
						"perfect": {
							"singular": {
								"first": ["abdicāvī"],
								"second": ["abdicāvistī"],
								"third": ["abdicāvit"]
							},
							"plural": {
								"first": ["abdicāvimus"],
								"second": ["abdicāvistis"],
								"third": ["abdicāvērunt", "abdicāvēre"]
							}
						},
						"pluperfect": {
							"singular": {
								"first": ["abdicāveram"],
								"second": ["abdicāverās"],
								"third": ["abdicāverat"]
							},
							"plural": {
								"first": ["abdicāverāmus"],
								"second": ["abdicāverātis"],
								"third": ["abdicāverant"]
							}
						},
						"futureperfect": {
							"singular": {
								"first": ["abdicāverō"],
								"second": ["abdicāveris"],
								"third": ["abdicāverit"]
							},
							"plural": {
								"first": ["abdicāverimus"],
								"second": ["abdicāveritis"],
								"third": ["abdicāverint"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"first": ["abdicor"],
								"second": ["abdicāris", "abdicāre"],
								"third": ["abdicātur"]
							},
							"plural": {
								"first": ["abdicāmur"],
								"second": ["abdicāminī"],
								"third": ["abdicantur"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdicābar"],
								"second": ["abdicābāris", "abdicābāre"],
								"third": ["abdicābātur"]
							},
							"plural": {
								"first": ["abdicābāmur"],
								"second": ["abdicābāminī"],
								"third": ["abdicābantur"]
							}
						},
						"future": {
							"singular": {
								"first": ["abdicābor"],
								"second": ["abdicāberis", "abdicābere"],
								"third": ["abdicābitur"]
							},
							"plural": {
								"first": ["abdicābimur"],
								"second": ["abdicābiminī"],
								"third": ["abdicābuntur"]
							}
						}
					}
				},
				"subjunctive": {
					"active": {
						"present": {
							"singular": {
								"first": ["abdicem"],
								"second": ["abdicēs"],
								"third": ["abdicet"]
							},
							"plural": {
								"first": ["abdicēmus"],
								"second": ["abdicētis"],
								"third": ["abdicent"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdicārem"],
								"second": ["abdicārēs"],
								"third": ["abdicāret"]
							},
							"plural": {
								"first": ["abdicārēmus"],
								"second": ["abdicārētis"],
								"third": ["abdicārent"]
							}
						},
						"perfect": {
							"singular": {
								"first": ["abdicāverim"],
								"second": ["abdicāverīs"],
								"third": ["abdicāverit"]
							},
							"plural": {
								"first": ["abdicāverīmus"],
								"second": ["abdicāverītis"],
								"third": ["abdicāverint"]
							}
						},
						"pluperfect": {
							"singular": {
								"first": ["abdicāvissem"],
								"second": ["abdicāvissēs"],
								"third": ["abdicāvisset"]
							},
							"plural": {
								"first": ["abdicāvissēmus"],
								"second": ["abdicāvissētis"],
								"third": ["abdicāvissent"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"first": ["abdicer"],
								"second": ["abdicēris", "abdicēre"],
								"third": ["abdicētur"]
							},
							"plural": {
								"first": ["abdicēmur"],
								"second": ["abdicēminī"],
								"third": ["abdicentur"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdicārer"],
								"second": ["abdicārēris", "abdicārēre"],
								"third": ["abdicārētur"]
							},
							"plural": {
								"first": ["abdicārēmur"],
								"second": ["abdicārēminī"],
								"third": ["abdicārentur"]
							}
						}
					}
				},
				"imperative": {
					"active": {
						"present": {
							"singular": {
								"second": ["abdicā"]
							},
							"plural": {
								"third": ["abdicāte"]
							}
						},
						"future": {
							"singular": {
								"second": ["abdicātō"],
								"third": ["abdicātō"]
							},
							"plural": {
								"second": ["abdicātōte"],
								"third": ["abdicantō"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"second": ["abdicāre"]
							},
							"plural": {
								"third": ["abdicāminī"]
							}
						},
						"future": {
							"singular": {
								"second": ["abdicātor"],
								"third": ["abdicātor"]
							},
							"plural": {
								"third": ["abdicantor"]
							}
						}
					}
				},
				"infinitive": {
					"active": {
						"present": ["abdicāre"],
						"past": ["abdicāvisse"]
					},
					"passive": {
						"present": ["abdicārī"]
					}
				},
				"participle": {
					"active": {
						"present": {
							"masculine": {
								"singular": {
									"nominative": ["abdicāns"],
									"vocative": ["abdicāns"],
									"accusative": ["abdicantem"],
									"genitive": ["abdicantis"],
									"dative": ["abdicantī"],
									"ablative": ["abdicante"]
								},
								"plural": {
									"nominative": ["abdicantēs"],
									"vocative": ["abdicantēs"],
									"accusative": ["abdicantēs", "abdicantīs"],
									"genitive": ["abdicantium"],
									"dative": ["abdicantibus"],
									"ablative": ["abdicantibus"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicāns"],
									"vocative": ["abdicāns"],
									"accusative": ["abdicantem"],
									"genitive": ["abdicantis"],
									"dative": ["abdicantī"],
									"ablative": ["abdicante"]
								},
								"plural": {
									"nominative": ["abdicantēs"],
									"vocative": ["abdicantēs"],
									"accusative": ["abdicantēs", "abdicantīs"],
									"genitive": ["abdicantium"],
									"dative": ["abdicantibus"],
									"ablative": ["abdicantibus"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdicāns"],
									"vocative": ["abdicāns"],
									"accusative": ["abdicāns"],
									"genitive": ["abdicantis"],
									"dative": ["abdicantī"],
									"ablative": ["abdicante"]
								},
								"plural": {
									"nominative": ["abdicantia"],
									"vocative": ["abdicantia"],
									"accusative": ["abdicantia"],
									"genitive": ["abdicantium"],
									"dative": ["abdicantibus"],
									"ablative": ["abdicantibus"]
								}
							}
						},
						"future": {
							"masculine": {
								"singular": {
									"nominative": ["abdicātūrus"],
									"vocative": ["abdicātūre"],
									"accusative": ["abdicātūrum"],
									"genitive": ["abdicātūrī"],
									"dative": ["abdicātūrō"],
									"ablative": ["abdicātūrō"]
								},
								"plural": {
									"nominative": ["abdicātūrī"],
									"vocative": ["abdicātūrī"],
									"accusative": ["abdicātūrōs"],
									"genitive": ["abdicātūrōrum"],
									"dative": ["abdicātūrīs"],
									"ablative": ["abdicātūrīs"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicātūra"],
									"vocative": ["abdicātūra"],
									"accusative": ["abdicātūram"],
									"genitive": ["abdicātūrae"],
									"dative": ["abdicātūrae"],
									"ablative": ["abdicātūrā"]
								},
								"plural": {
									"nominative": ["abdicātūrae"],
									"vocative": ["abdicātūrae"],
									"accusative": ["abdicātūrās"],
									"genitive": ["abdicātūrārum"],
									"dative": ["abdicātūrīs"],
									"ablative": ["abdicātūrīs"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdicātūrum"],
									"vocative": ["abdicātūrum"],
									"accusative": ["abdicātūrum"],
									"genitive": ["abdicātūrī"],
									"dative": ["abdicātūrō"],
									"ablative": ["abdicātūrō"]
								},
								"plural": {
									"nominative": ["abdicātūra"],
									"vocative": ["abdicātūra"],
									"accusative": ["abdicātūra"],
									"genitive": ["abdicātūrōrum"],
									"dative": ["abdicātūrīs"],
									"ablative": ["abdicātūrīs"]
								}
							}
						}
					},
					"passive": {
						"past": {
							"masculine": {
								"singular": {
									"nominative": ["abdicātus"],
									"vocative": ["abdicāte"],
									"accusative": ["abdicātum"],
									"genitive": ["abdicātī"],
									"dative": ["abdicātō"],
									"ablative": ["abdicātō"]
								},
								"plural": {
									"nominative": ["abdicātī"],
									"vocative": ["abdicātī"],
									"accusative": ["abdicātōs"],
									"genitive": ["abdicātōrum"],
									"dative": ["abdicātīs"],
									"ablative": ["abdicātīs"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicāta"],
									"vocative": ["abdicāta"],
									"accusative": ["abdicātam"],
									"genitive": ["abdicātae"],
									"dative": ["abdicātae"],
									"ablative": ["abdicātā"]
								},
								"plural": {
									"nominative": ["abdicātae"],
									"vocative": ["abdicātae"],
									"accusative": ["abdicātās"],
									"genitive": ["abdicātārum"],
									"dative": ["abdicātīs"],
									"ablative": ["abdicātīs"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdicātum"],
									"vocative": ["abdicātum"],
									"accusative": ["abdicātum"],
									"genitive": ["abdicātī"],
									"dative": ["abdicātō"],
									"ablative": ["abdicātō"]
								},
								"plural": {
									"nominative": ["abdicāta"],
									"vocative": ["abdicāta"],
									"accusative": ["abdicāta"],
									"genitive": ["abdicātōrum"],
									"dative": ["abdicātīs"],
									"ablative": ["abdicātīs"]
								}
							}
						},
						"future": {
							"masculine": {
								"singular": {
									"nominative": ["abdicandus"],
									"vocative": ["abdicande"],
									"accusative": ["abdicandum"],
									"genitive": ["abdicandī"],
									"dative": ["abdicandō"],
									"ablative": ["abdicandō"]
								},
								"plural": {
									"nominative": ["abdicandī"],
									"vocative": ["abdicandī"],
									"accusative": ["abdicandōs"],
									"genitive": ["abdicandōrum"],
									"dative": ["abdicandīs"],
									"ablative": ["abdicandīs"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicanda"],
									"vocative": ["abdicanda"],
									"accusative": ["abdicandam"],
									"genitive": ["abdicandae"],
									"dative": ["abdicandae"],
									"ablative": ["abdicandā"]
								},
								"plural": {
									"nominative": ["abdicandae"],
									"vocative": ["abdicandae"],
									"accusative": ["abdicandās"],
									"genitive": ["abdicandārum"],
									"dative": ["abdicandīs"],
									"ablative": ["abdicandīs"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdicandum"],
									"vocative": ["abdicandum"],
									"accusative": ["abdicandum"],
									"genitive": ["abdicandī"],
									"dative": ["abdicandō"],
									"ablative": ["abdicandō"]
								},
								"plural": {
									"nominative": ["abdicanda"],
									"vocative": ["abdicanda"],
									"accusative": ["abdicanda"],
									"genitive": ["abdicandōrum"],
									"dative": ["abdicandīs"],
									"ablative": ["abdicandīs"]
								}
							}
						}
					}
				},
				"gerund": {
					"accusative": ["abdicandum"],
					"genitive": ["abdicandī"],
					"dative": ["abdicandō"],
					"ablative": ["abdicandō"]
				},
				"supine": {
					"accusative": ["abdicātum"],
					"ablative": ["abdicātū"]
				}
			},
			"ne": {
				"indicative": {
					"active": {
						"present": {
							"singular": {
								"first": ["abdicōne"],
								"second": ["abdicāsne"],
								"third": ["abdicatne"]
							},
							"plural": {
								"first": ["abdicāmusne"],
								"second": ["abdicātisne"],
								"third": ["abdicantne"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdicābamne"],
								"second": ["abdicābāsne"],
								"third": ["abdicābatne"]
							},
							"plural": {
								"first": ["abdicābāmusne"],
								"second": ["abdicābātisne"],
								"third": ["abdicābantne"]
							}
						},
						"future": {
							"singular": {
								"first": ["abdicābōne"],
								"second": ["abdicābisne"],
								"third": ["abdicābitne"]
							},
							"plural": {
								"first": ["abdicābimusne"],
								"second": ["abdicābitisne"],
								"third": ["abdicābuntne"]
							}
						},
						"perfect": {
							"singular": {
								"first": ["abdicāvīne"],
								"second": ["abdicāvistīne"],
								"third": ["abdicāvitne"]
							},
							"plural": {
								"first": ["abdicāvimusne"],
								"second": ["abdicāvistisne"],
								"third": ["abdicāvēruntne", "abdicāvērene"]
							}
						},
						"pluperfect": {
							"singular": {
								"first": ["abdicāveramne"],
								"second": ["abdicāverāsne"],
								"third": ["abdicāveratne"]
							},
							"plural": {
								"first": ["abdicāverāmusne"],
								"second": ["abdicāverātisne"],
								"third": ["abdicāverantne"]
							}
						},
						"futureperfect": {
							"singular": {
								"first": ["abdicāverōne"],
								"second": ["abdicāverisne"],
								"third": ["abdicāveritne"]
							},
							"plural": {
								"first": ["abdicāverimusne"],
								"second": ["abdicāveritisne"],
								"third": ["abdicāverintne"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"first": ["abdicorne"],
								"second": ["abdicārisne", "abdicārene"],
								"third": ["abdicāturne"]
							},
							"plural": {
								"first": ["abdicāmurne"],
								"second": ["abdicāminīne"],
								"third": ["abdicanturne"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdicābarne"],
								"second": ["abdicābārisne", "abdicābārene"],
								"third": ["abdicābāturne"]
							},
							"plural": {
								"first": ["abdicābāmurne"],
								"second": ["abdicābāminīne"],
								"third": ["abdicābanturne"]
							}
						},
						"future": {
							"singular": {
								"first": ["abdicāborne"],
								"second": ["abdicāberisne", "abdicāberene"],
								"third": ["abdicābiturne"]
							},
							"plural": {
								"first": ["abdicābimurne"],
								"second": ["abdicābiminīne"],
								"third": ["abdicābunturne"]
							}
						}
					}
				},
				"subjunctive": {
					"active": {
						"present": {
							"singular": {
								"first": ["abdicemne"],
								"second": ["abdicēsne"],
								"third": ["abdicetne"]
							},
							"plural": {
								"first": ["abdicēmusne"],
								"second": ["abdicētisne"],
								"third": ["abdicentne"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdicāremne"],
								"second": ["abdicārēsne"],
								"third": ["abdicāretne"]
							},
							"plural": {
								"first": ["abdicārēmusne"],
								"second": ["abdicārētisne"],
								"third": ["abdicārentne"]
							}
						},
						"perfect": {
							"singular": {
								"first": ["abdicāverimne"],
								"second": ["abdicāverīsne"],
								"third": ["abdicāveritne"]
							},
							"plural": {
								"first": ["abdicāverīmusne"],
								"second": ["abdicāverītisne"],
								"third": ["abdicāverintne"]
							}
						},
						"pluperfect": {
							"singular": {
								"first": ["abdicāvissemne"],
								"second": ["abdicāvissēsne"],
								"third": ["abdicāvissetne"]
							},
							"plural": {
								"first": ["abdicāvissēmusne"],
								"second": ["abdicāvissētisne"],
								"third": ["abdicāvissentne"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"first": ["abdicerne"],
								"second": ["abdicērisne", "abdicērene"],
								"third": ["abdicēturne"]
							},
							"plural": {
								"first": ["abdicēmurne"],
								"second": ["abdicēminīne"],
								"third": ["abdicenturne"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdicārerne"],
								"second": ["abdicārērisne", "abdicārērene"],
								"third": ["abdicārēturne"]
							},
							"plural": {
								"first": ["abdicārēmurne"],
								"second": ["abdicārēminīne"],
								"third": ["abdicārenturne"]
							}
						}
					}
				},
				"imperative": {
					"active": {
						"present": {
							"singular": {
								"second": ["abdicāne"]
							},
							"plural": {
								"third": ["abdicātene"]
							}
						},
						"future": {
							"singular": {
								"second": ["abdicātōne"],
								"third": ["abdicātōne"]
							},
							"plural": {
								"second": ["abdicātōtene"],
								"third": ["abdicantōne"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"second": ["abdicārene"]
							},
							"plural": {
								"third": ["abdicāminīne"]
							}
						},
						"future": {
							"singular": {
								"second": ["abdicātorne"],
								"third": ["abdicātorne"]
							},
							"plural": {
								"third": ["abdicantorne"]
							}
						}
					}
				},
				"infinitive": {
					"active": {
						"present": ["abdicārene"],
						"past": ["abdicāvissene"]
					},
					"passive": {
						"present": ["abdicārīne"]
					}
				},
				"participle": {
					"active": {
						"present": {
							"masculine": {
								"singular": {
									"nominative": ["abdicānsne"],
									"vocative": ["abdicānsne"],
									"accusative": ["abdicantemne"],
									"genitive": ["abdicantisne"],
									"dative": ["abdicantīne"],
									"ablative": ["abdicantene"]
								},
								"plural": {
									"nominative": ["abdicantēsne"],
									"vocative": ["abdicantēsne"],
									"accusative": ["abdicantēsne", "abdicantīsne"],
									"genitive": ["abdicantiumne"],
									"dative": ["abdicantibusne"],
									"ablative": ["abdicantibusne"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicānsne"],
									"vocative": ["abdicānsne"],
									"accusative": ["abdicantemne"],
									"genitive": ["abdicantisne"],
									"dative": ["abdicantīne"],
									"ablative": ["abdicantene"]
								},
								"plural": {
									"nominative": ["abdicantēsne"],
									"vocative": ["abdicantēsne"],
									"accusative": ["abdicantēsne", "abdicantīsne"],
									"genitive": ["abdicantiumne"],
									"dative": ["abdicantibusne"],
									"ablative": ["abdicantibusne"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdicānsne"],
									"vocative": ["abdicānsne"],
									"accusative": ["abdicānsne"],
									"genitive": ["abdicantisne"],
									"dative": ["abdicantīne"],
									"ablative": ["abdicantene"]
								},
								"plural": {
									"nominative": ["abdicantiane"],
									"vocative": ["abdicantiane"],
									"accusative": ["abdicantiane"],
									"genitive": ["abdicantiumne"],
									"dative": ["abdicantibusne"],
									"ablative": ["abdicantibusne"]
								}
							}
						},
						"future": {
							"masculine": {
								"singular": {
									"nominative": ["abdicātūrusne"],
									"vocative": ["abdicātūrene"],
									"accusative": ["abdicātūrumne"],
									"genitive": ["abdicātūrīne"],
									"dative": ["abdicātūrōne"],
									"ablative": ["abdicātūrōne"]
								},
								"plural": {
									"nominative": ["abdicātūrīne"],
									"vocative": ["abdicātūrīne"],
									"accusative": ["abdicātūrōsne"],
									"genitive": ["abdicātūrōrumne"],
									"dative": ["abdicātūrīsne"],
									"ablative": ["abdicātūrīsne"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicātūrane"],
									"vocative": ["abdicātūrane"],
									"accusative": ["abdicātūramne"],
									"genitive": ["abdicātūraene"],
									"dative": ["abdicātūraene"],
									"ablative": ["abdicātūrāne"]
								},
								"plural": {
									"nominative": ["abdicātūraene"],
									"vocative": ["abdicātūraene"],
									"accusative": ["abdicātūrāsne"],
									"genitive": ["abdicātūrārumne"],
									"dative": ["abdicātūrīsne"],
									"ablative": ["abdicātūrīsne"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdicātūrumne"],
									"vocative": ["abdicātūrumne"],
									"accusative": ["abdicātūrumne"],
									"genitive": ["abdicātūrīne"],
									"dative": ["abdicātūrōne"],
									"ablative": ["abdicātūrōne"]
								},
								"plural": {
									"nominative": ["abdicātūrane"],
									"vocative": ["abdicātūrane"],
									"accusative": ["abdicātūrane"],
									"genitive": ["abdicātūrōrumne"],
									"dative": ["abdicātūrīsne"],
									"ablative": ["abdicātūrīsne"]
								}
							}
						}
					},
					"passive": {
						"past": {
							"masculine": {
								"singular": {
									"nominative": ["abdicātusne"],
									"vocative": ["abdicātene"],
									"accusative": ["abdicātumne"],
									"genitive": ["abdicātīne"],
									"dative": ["abdicātōne"],
									"ablative": ["abdicātōne"]
								},
								"plural": {
									"nominative": ["abdicātīne"],
									"vocative": ["abdicātīne"],
									"accusative": ["abdicātōsne"],
									"genitive": ["abdicātōrumne"],
									"dative": ["abdicātīsne"],
									"ablative": ["abdicātīsne"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicātane"],
									"vocative": ["abdicātane"],
									"accusative": ["abdicātamne"],
									"genitive": ["abdicātaene"],
									"dative": ["abdicātaene"],
									"ablative": ["abdicātāne"]
								},
								"plural": {
									"nominative": ["abdicātaene"],
									"vocative": ["abdicātaene"],
									"accusative": ["abdicātāsne"],
									"genitive": ["abdicātārumne"],
									"dative": ["abdicātīsne"],
									"ablative": ["abdicātīsne"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdicātumne"],
									"vocative": ["abdicātumne"],
									"accusative": ["abdicātumne"],
									"genitive": ["abdicātīne"],
									"dative": ["abdicātōne"],
									"ablative": ["abdicātōne"]
								},
								"plural": {
									"nominative": ["abdicātane"],
									"vocative": ["abdicātane"],
									"accusative": ["abdicātane"],
									"genitive": ["abdicātōrumne"],
									"dative": ["abdicātīsne"],
									"ablative": ["abdicātīsne"]
								}
							}
						},
						"future": {
							"masculine": {
								"singular": {
									"nominative": ["abdicandusne"],
									"vocative": ["abdicandene"],
									"accusative": ["abdicandumne"],
									"genitive": ["abdicandīne"],
									"dative": ["abdicandōne"],
									"ablative": ["abdicandōne"]
								},
								"plural": {
									"nominative": ["abdicandīne"],
									"vocative": ["abdicandīne"],
									"accusative": ["abdicandōsne"],
									"genitive": ["abdicandōrumne"],
									"dative": ["abdicandīsne"],
									"ablative": ["abdicandīsne"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicandane"],
									"vocative": ["abdicandane"],
									"accusative": ["abdicandamne"],
									"genitive": ["abdicandaene"],
									"dative": ["abdicandaene"],
									"ablative": ["abdicandāne"]
								},
								"plural": {
									"nominative": ["abdicandaene"],
									"vocative": ["abdicandaene"],
									"accusative": ["abdicandāsne"],
									"genitive": ["abdicandārumne"],
									"dative": ["abdicandīsne"],
									"ablative": ["abdicandīsne"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdicandumne"],
									"vocative": ["abdicandumne"],
									"accusative": ["abdicandumne"],
									"genitive": ["abdicandīne"],
									"dative": ["abdicandōne"],
									"ablative": ["abdicandōne"]
								},
								"plural": {
									"nominative": ["abdicandane"],
									"vocative": ["abdicandane"],
									"accusative": ["abdicandane"],
									"genitive": ["abdicandōrumne"],
									"dative": ["abdicandīsne"],
									"ablative": ["abdicandīsne"]
								}
							}
						}
					}
				},
				"gerund": {
					"accusative": ["abdicandumne"],
					"genitive": ["abdicandīne"],
					"dative": ["abdicandōne"],
					"ablative": ["abdicandōne"]
				},
				"supine": {
					"accusative": ["abdicātumne"],
					"ablative": ["abdicātūne"]
				}
			},
			"que": {
				"indicative": {
					"active": {
						"present": {
							"singular": {
								"first": ["abdicōque"],
								"second": ["abdicāsque"],
								"third": ["abdicatque"]
							},
							"plural": {
								"first": ["abdicāmusque"],
								"second": ["abdicātisque"],
								"third": ["abdicantque"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdicābamque"],
								"second": ["abdicābāsque"],
								"third": ["abdicābatque"]
							},
							"plural": {
								"first": ["abdicābāmusque"],
								"second": ["abdicābātisque"],
								"third": ["abdicābantque"]
							}
						},
						"future": {
							"singular": {
								"first": ["abdicābōque"],
								"second": ["abdicābisque"],
								"third": ["abdicābitque"]
							},
							"plural": {
								"first": ["abdicābimusque"],
								"second": ["abdicābitisque"],
								"third": ["abdicābuntque"]
							}
						},
						"perfect": {
							"singular": {
								"first": ["abdicāvīque"],
								"second": ["abdicāvistīque"],
								"third": ["abdicāvitque"]
							},
							"plural": {
								"first": ["abdicāvimusque"],
								"second": ["abdicāvistisque"],
								"third": ["abdicāvēruntque", "abdicāvēreque"]
							}
						},
						"pluperfect": {
							"singular": {
								"first": ["abdicāveramque"],
								"second": ["abdicāverāsque"],
								"third": ["abdicāveratque"]
							},
							"plural": {
								"first": ["abdicāverāmusque"],
								"second": ["abdicāverātisque"],
								"third": ["abdicāverantque"]
							}
						},
						"futureperfect": {
							"singular": {
								"first": ["abdicāverōque"],
								"second": ["abdicāverisque"],
								"third": ["abdicāveritque"]
							},
							"plural": {
								"first": ["abdicāverimusque"],
								"second": ["abdicāveritisque"],
								"third": ["abdicāverintque"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"first": ["abdicorque"],
								"second": ["abdicārisque", "abdicāreque"],
								"third": ["abdicāturque"]
							},
							"plural": {
								"first": ["abdicāmurque"],
								"second": ["abdicāminīque"],
								"third": ["abdicanturque"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdicābarque"],
								"second": ["abdicābārisque", "abdicābāreque"],
								"third": ["abdicābāturque"]
							},
							"plural": {
								"first": ["abdicābāmurque"],
								"second": ["abdicābāminīque"],
								"third": ["abdicābanturque"]
							}
						},
						"future": {
							"singular": {
								"first": ["abdicāborque"],
								"second": ["abdicāberisque", "abdicābereque"],
								"third": ["abdicābiturque"]
							},
							"plural": {
								"first": ["abdicābimurque"],
								"second": ["abdicābiminīque"],
								"third": ["abdicābunturque"]
							}
						}
					}
				},
				"subjunctive": {
					"active": {
						"present": {
							"singular": {
								"first": ["abdicemque"],
								"second": ["abdicēsque"],
								"third": ["abdicetque"]
							},
							"plural": {
								"first": ["abdicēmusque"],
								"second": ["abdicētisque"],
								"third": ["abdicentque"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdicāremque"],
								"second": ["abdicārēsque"],
								"third": ["abdicāretque"]
							},
							"plural": {
								"first": ["abdicārēmusque"],
								"second": ["abdicārētisque"],
								"third": ["abdicārentque"]
							}
						},
						"perfect": {
							"singular": {
								"first": ["abdicāverimque"],
								"second": ["abdicāverīsque"],
								"third": ["abdicāveritque"]
							},
							"plural": {
								"first": ["abdicāverīmusque"],
								"second": ["abdicāverītisque"],
								"third": ["abdicāverintque"]
							}
						},
						"pluperfect": {
							"singular": {
								"first": ["abdicāvissemque"],
								"second": ["abdicāvissēsque"],
								"third": ["abdicāvissetque"]
							},
							"plural": {
								"first": ["abdicāvissēmusque"],
								"second": ["abdicāvissētisque"],
								"third": ["abdicāvissentque"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"first": ["abdicerque"],
								"second": ["abdicērisque", "abdicēreque"],
								"third": ["abdicēturque"]
							},
							"plural": {
								"first": ["abdicēmurque"],
								"second": ["abdicēminīque"],
								"third": ["abdicenturque"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdicārerque"],
								"second": ["abdicārērisque", "abdicārēreque"],
								"third": ["abdicārēturque"]
							},
							"plural": {
								"first": ["abdicārēmurque"],
								"second": ["abdicārēminīque"],
								"third": ["abdicārenturque"]
							}
						}
					}
				},
				"imperative": {
					"active": {
						"present": {
							"singular": {
								"second": ["abdicāque"]
							},
							"plural": {
								"third": ["abdicāteque"]
							}
						},
						"future": {
							"singular": {
								"second": ["abdicātōque"],
								"third": ["abdicātōque"]
							},
							"plural": {
								"second": ["abdicātōteque"],
								"third": ["abdicantōque"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"second": ["abdicāreque"]
							},
							"plural": {
								"third": ["abdicāminīque"]
							}
						},
						"future": {
							"singular": {
								"second": ["abdicātorque"],
								"third": ["abdicātorque"]
							},
							"plural": {
								"third": ["abdicantorque"]
							}
						}
					}
				},
				"infinitive": {
					"active": {
						"present": ["abdicāreque"],
						"past": ["abdicāvisseque"]
					},
					"passive": {
						"present": ["abdicārīque"]
					}
				},
				"participle": {
					"active": {
						"present": {
							"masculine": {
								"singular": {
									"nominative": ["abdicānsque"],
									"vocative": ["abdicānsque"],
									"accusative": ["abdicantemque"],
									"genitive": ["abdicantisque"],
									"dative": ["abdicantīque"],
									"ablative": ["abdicanteque"]
								},
								"plural": {
									"nominative": ["abdicantēsque"],
									"vocative": ["abdicantēsque"],
									"accusative": ["abdicantēsque", "abdicantīsque"],
									"genitive": ["abdicantiumque"],
									"dative": ["abdicantibusque"],
									"ablative": ["abdicantibusque"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicānsque"],
									"vocative": ["abdicānsque"],
									"accusative": ["abdicantemque"],
									"genitive": ["abdicantisque"],
									"dative": ["abdicantīque"],
									"ablative": ["abdicanteque"]
								},
								"plural": {
									"nominative": ["abdicantēsque"],
									"vocative": ["abdicantēsque"],
									"accusative": ["abdicantēsque", "abdicantīsque"],
									"genitive": ["abdicantiumque"],
									"dative": ["abdicantibusque"],
									"ablative": ["abdicantibusque"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdicānsque"],
									"vocative": ["abdicānsque"],
									"accusative": ["abdicānsque"],
									"genitive": ["abdicantisque"],
									"dative": ["abdicantīque"],
									"ablative": ["abdicanteque"]
								},
								"plural": {
									"nominative": ["abdicantiaque"],
									"vocative": ["abdicantiaque"],
									"accusative": ["abdicantiaque"],
									"genitive": ["abdicantiumque"],
									"dative": ["abdicantibusque"],
									"ablative": ["abdicantibusque"]
								}
							}
						},
						"future": {
							"masculine": {
								"singular": {
									"nominative": ["abdicātūrusque"],
									"vocative": ["abdicātūreque"],
									"accusative": ["abdicātūrumque"],
									"genitive": ["abdicātūrīque"],
									"dative": ["abdicātūrōque"],
									"ablative": ["abdicātūrōque"]
								},
								"plural": {
									"nominative": ["abdicātūrīque"],
									"vocative": ["abdicātūrīque"],
									"accusative": ["abdicātūrōsque"],
									"genitive": ["abdicātūrōrumque"],
									"dative": ["abdicātūrīsque"],
									"ablative": ["abdicātūrīsque"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicātūraque"],
									"vocative": ["abdicātūraque"],
									"accusative": ["abdicātūramque"],
									"genitive": ["abdicātūraeque"],
									"dative": ["abdicātūraeque"],
									"ablative": ["abdicātūrāque"]
								},
								"plural": {
									"nominative": ["abdicātūraeque"],
									"vocative": ["abdicātūraeque"],
									"accusative": ["abdicātūrāsque"],
									"genitive": ["abdicātūrārumque"],
									"dative": ["abdicātūrīsque"],
									"ablative": ["abdicātūrīsque"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdicātūrumque"],
									"vocative": ["abdicātūrumque"],
									"accusative": ["abdicātūrumque"],
									"genitive": ["abdicātūrīque"],
									"dative": ["abdicātūrōque"],
									"ablative": ["abdicātūrōque"]
								},
								"plural": {
									"nominative": ["abdicātūraque"],
									"vocative": ["abdicātūraque"],
									"accusative": ["abdicātūraque"],
									"genitive": ["abdicātūrōrumque"],
									"dative": ["abdicātūrīsque"],
									"ablative": ["abdicātūrīsque"]
								}
							}
						}
					},
					"passive": {
						"past": {
							"masculine": {
								"singular": {
									"nominative": ["abdicātusque"],
									"vocative": ["abdicāteque"],
									"accusative": ["abdicātumque"],
									"genitive": ["abdicātīque"],
									"dative": ["abdicātōque"],
									"ablative": ["abdicātōque"]
								},
								"plural": {
									"nominative": ["abdicātīque"],
									"vocative": ["abdicātīque"],
									"accusative": ["abdicātōsque"],
									"genitive": ["abdicātōrumque"],
									"dative": ["abdicātīsque"],
									"ablative": ["abdicātīsque"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicātaque"],
									"vocative": ["abdicātaque"],
									"accusative": ["abdicātamque"],
									"genitive": ["abdicātaeque"],
									"dative": ["abdicātaeque"],
									"ablative": ["abdicātāque"]
								},
								"plural": {
									"nominative": ["abdicātaeque"],
									"vocative": ["abdicātaeque"],
									"accusative": ["abdicātāsque"],
									"genitive": ["abdicātārumque"],
									"dative": ["abdicātīsque"],
									"ablative": ["abdicātīsque"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdicātumque"],
									"vocative": ["abdicātumque"],
									"accusative": ["abdicātumque"],
									"genitive": ["abdicātīque"],
									"dative": ["abdicātōque"],
									"ablative": ["abdicātōque"]
								},
								"plural": {
									"nominative": ["abdicātaque"],
									"vocative": ["abdicātaque"],
									"accusative": ["abdicātaque"],
									"genitive": ["abdicātōrumque"],
									"dative": ["abdicātīsque"],
									"ablative": ["abdicātīsque"]
								}
							}
						},
						"future": {
							"masculine": {
								"singular": {
									"nominative": ["abdicandusque"],
									"vocative": ["abdicandeque"],
									"accusative": ["abdicandumque"],
									"genitive": ["abdicandīque"],
									"dative": ["abdicandōque"],
									"ablative": ["abdicandōque"]
								},
								"plural": {
									"nominative": ["abdicandīque"],
									"vocative": ["abdicandīque"],
									"accusative": ["abdicandōsque"],
									"genitive": ["abdicandōrumque"],
									"dative": ["abdicandīsque"],
									"ablative": ["abdicandīsque"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicandaque"],
									"vocative": ["abdicandaque"],
									"accusative": ["abdicandamque"],
									"genitive": ["abdicandaeque"],
									"dative": ["abdicandaeque"],
									"ablative": ["abdicandāque"]
								},
								"plural": {
									"nominative": ["abdicandaeque"],
									"vocative": ["abdicandaeque"],
									"accusative": ["abdicandāsque"],
									"genitive": ["abdicandārumque"],
									"dative": ["abdicandīsque"],
									"ablative": ["abdicandīsque"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdicandumque"],
									"vocative": ["abdicandumque"],
									"accusative": ["abdicandumque"],
									"genitive": ["abdicandīque"],
									"dative": ["abdicandōque"],
									"ablative": ["abdicandōque"]
								},
								"plural": {
									"nominative": ["abdicandaque"],
									"vocative": ["abdicandaque"],
									"accusative": ["abdicandaque"],
									"genitive": ["abdicandōrumque"],
									"dative": ["abdicandīsque"],
									"ablative": ["abdicandīsque"]
								}
							}
						}
					}
				},
				"gerund": {
					"accusative": ["abdicandumque"],
					"genitive": ["abdicandīque"],
					"dative": ["abdicandōque"],
					"ablative": ["abdicandōque"]
				},
				"supine": {
					"accusative": ["abdicātumque"],
					"ablative": ["abdicātūque"]
				}
			},
			"ve": {
				"indicative": {
					"active": {
						"present": {
							"singular": {
								"first": ["abdicōve"],
								"second": ["abdicāsve"],
								"third": ["abdicatve"]
							},
							"plural": {
								"first": ["abdicāmusve"],
								"second": ["abdicātisve"],
								"third": ["abdicantve"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdicābamve"],
								"second": ["abdicābāsve"],
								"third": ["abdicābatve"]
							},
							"plural": {
								"first": ["abdicābāmusve"],
								"second": ["abdicābātisve"],
								"third": ["abdicābantve"]
							}
						},
						"future": {
							"singular": {
								"first": ["abdicābōve"],
								"second": ["abdicābisve"],
								"third": ["abdicābitve"]
							},
							"plural": {
								"first": ["abdicābimusve"],
								"second": ["abdicābitisve"],
								"third": ["abdicābuntve"]
							}
						},
						"perfect": {
							"singular": {
								"first": ["abdicāvīve"],
								"second": ["abdicāvistīve"],
								"third": ["abdicāvitve"]
							},
							"plural": {
								"first": ["abdicāvimusve"],
								"second": ["abdicāvistisve"],
								"third": ["abdicāvēruntve", "abdicāvēreve"]
							}
						},
						"pluperfect": {
							"singular": {
								"first": ["abdicāveramve"],
								"second": ["abdicāverāsve"],
								"third": ["abdicāveratve"]
							},
							"plural": {
								"first": ["abdicāverāmusve"],
								"second": ["abdicāverātisve"],
								"third": ["abdicāverantve"]
							}
						},
						"futureperfect": {
							"singular": {
								"first": ["abdicāverōve"],
								"second": ["abdicāverisve"],
								"third": ["abdicāveritve"]
							},
							"plural": {
								"first": ["abdicāverimusve"],
								"second": ["abdicāveritisve"],
								"third": ["abdicāverintve"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"first": ["abdicorve"],
								"second": ["abdicārisve", "abdicāreve"],
								"third": ["abdicāturve"]
							},
							"plural": {
								"first": ["abdicāmurve"],
								"second": ["abdicāminīve"],
								"third": ["abdicanturve"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdicābarve"],
								"second": ["abdicābārisve", "abdicābāreve"],
								"third": ["abdicābāturve"]
							},
							"plural": {
								"first": ["abdicābāmurve"],
								"second": ["abdicābāminīve"],
								"third": ["abdicābanturve"]
							}
						},
						"future": {
							"singular": {
								"first": ["abdicāborve"],
								"second": ["abdicāberisve", "abdicābereve"],
								"third": ["abdicābiturve"]
							},
							"plural": {
								"first": ["abdicābimurve"],
								"second": ["abdicābiminīve"],
								"third": ["abdicābunturve"]
							}
						}
					}
				},
				"subjunctive": {
					"active": {
						"present": {
							"singular": {
								"first": ["abdicemve"],
								"second": ["abdicēsve"],
								"third": ["abdicetve"]
							},
							"plural": {
								"first": ["abdicēmusve"],
								"second": ["abdicētisve"],
								"third": ["abdicentve"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdicāremve"],
								"second": ["abdicārēsve"],
								"third": ["abdicāretve"]
							},
							"plural": {
								"first": ["abdicārēmusve"],
								"second": ["abdicārētisve"],
								"third": ["abdicārentve"]
							}
						},
						"perfect": {
							"singular": {
								"first": ["abdicāverimve"],
								"second": ["abdicāverīsve"],
								"third": ["abdicāveritve"]
							},
							"plural": {
								"first": ["abdicāverīmusve"],
								"second": ["abdicāverītisve"],
								"third": ["abdicāverintve"]
							}
						},
						"pluperfect": {
							"singular": {
								"first": ["abdicāvissemve"],
								"second": ["abdicāvissēsve"],
								"third": ["abdicāvissetve"]
							},
							"plural": {
								"first": ["abdicāvissēmusve"],
								"second": ["abdicāvissētisve"],
								"third": ["abdicāvissentve"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"first": ["abdicerve"],
								"second": ["abdicērisve", "abdicēreve"],
								"third": ["abdicēturve"]
							},
							"plural": {
								"first": ["abdicēmurve"],
								"second": ["abdicēminīve"],
								"third": ["abdicenturve"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdicārerve"],
								"second": ["abdicārērisve", "abdicārēreve"],
								"third": ["abdicārēturve"]
							},
							"plural": {
								"first": ["abdicārēmurve"],
								"second": ["abdicārēminīve"],
								"third": ["abdicārenturve"]
							}
						}
					}
				},
				"imperative": {
					"active": {
						"present": {
							"singular": {
								"second": ["abdicāve"]
							},
							"plural": {
								"third": ["abdicāteve"]
							}
						},
						"future": {
							"singular": {
								"second": ["abdicātōve"],
								"third": ["abdicātōve"]
							},
							"plural": {
								"second": ["abdicātōteve"],
								"third": ["abdicantōve"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"second": ["abdicāreve"]
							},
							"plural": {
								"third": ["abdicāminīve"]
							}
						},
						"future": {
							"singular": {
								"second": ["abdicātorve"],
								"third": ["abdicātorve"]
							},
							"plural": {
								"third": ["abdicantorve"]
							}
						}
					}
				},
				"infinitive": {
					"active": {
						"present": ["abdicāreve"],
						"past": ["abdicāvisseve"]
					},
					"passive": {
						"present": ["abdicārīve"]
					}
				},
				"participle": {
					"active": {
						"present": {
							"masculine": {
								"singular": {
									"nominative": ["abdicānsve"],
									"vocative": ["abdicānsve"],
									"accusative": ["abdicantemve"],
									"genitive": ["abdicantisve"],
									"dative": ["abdicantīve"],
									"ablative": ["abdicanteve"]
								},
								"plural": {
									"nominative": ["abdicantēsve"],
									"vocative": ["abdicantēsve"],
									"accusative": ["abdicantēsve", "abdicantīsve"],
									"genitive": ["abdicantiumve"],
									"dative": ["abdicantibusve"],
									"ablative": ["abdicantibusve"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicānsve"],
									"vocative": ["abdicānsve"],
									"accusative": ["abdicantemve"],
									"genitive": ["abdicantisve"],
									"dative": ["abdicantīve"],
									"ablative": ["abdicanteve"]
								},
								"plural": {
									"nominative": ["abdicantēsve"],
									"vocative": ["abdicantēsve"],
									"accusative": ["abdicantēsve", "abdicantīsve"],
									"genitive": ["abdicantiumve"],
									"dative": ["abdicantibusve"],
									"ablative": ["abdicantibusve"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdicānsve"],
									"vocative": ["abdicānsve"],
									"accusative": ["abdicānsve"],
									"genitive": ["abdicantisve"],
									"dative": ["abdicantīve"],
									"ablative": ["abdicanteve"]
								},
								"plural": {
									"nominative": ["abdicantiave"],
									"vocative": ["abdicantiave"],
									"accusative": ["abdicantiave"],
									"genitive": ["abdicantiumve"],
									"dative": ["abdicantibusve"],
									"ablative": ["abdicantibusve"]
								}
							}
						},
						"future": {
							"masculine": {
								"singular": {
									"nominative": ["abdicātūrusve"],
									"vocative": ["abdicātūreve"],
									"accusative": ["abdicātūrumve"],
									"genitive": ["abdicātūrīve"],
									"dative": ["abdicātūrōve"],
									"ablative": ["abdicātūrōve"]
								},
								"plural": {
									"nominative": ["abdicātūrīve"],
									"vocative": ["abdicātūrīve"],
									"accusative": ["abdicātūrōsve"],
									"genitive": ["abdicātūrōrumve"],
									"dative": ["abdicātūrīsve"],
									"ablative": ["abdicātūrīsve"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicātūrave"],
									"vocative": ["abdicātūrave"],
									"accusative": ["abdicātūramve"],
									"genitive": ["abdicātūraeve"],
									"dative": ["abdicātūraeve"],
									"ablative": ["abdicātūrāve"]
								},
								"plural": {
									"nominative": ["abdicātūraeve"],
									"vocative": ["abdicātūraeve"],
									"accusative": ["abdicātūrāsve"],
									"genitive": ["abdicātūrārumve"],
									"dative": ["abdicātūrīsve"],
									"ablative": ["abdicātūrīsve"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdicātūrumve"],
									"vocative": ["abdicātūrumve"],
									"accusative": ["abdicātūrumve"],
									"genitive": ["abdicātūrīve"],
									"dative": ["abdicātūrōve"],
									"ablative": ["abdicātūrōve"]
								},
								"plural": {
									"nominative": ["abdicātūrave"],
									"vocative": ["abdicātūrave"],
									"accusative": ["abdicātūrave"],
									"genitive": ["abdicātūrōrumve"],
									"dative": ["abdicātūrīsve"],
									"ablative": ["abdicātūrīsve"]
								}
							}
						}
					},
					"passive": {
						"past": {
							"masculine": {
								"singular": {
									"nominative": ["abdicātusve"],
									"vocative": ["abdicāteve"],
									"accusative": ["abdicātumve"],
									"genitive": ["abdicātīve"],
									"dative": ["abdicātōve"],
									"ablative": ["abdicātōve"]
								},
								"plural": {
									"nominative": ["abdicātīve"],
									"vocative": ["abdicātīve"],
									"accusative": ["abdicātōsve"],
									"genitive": ["abdicātōrumve"],
									"dative": ["abdicātīsve"],
									"ablative": ["abdicātīsve"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicātave"],
									"vocative": ["abdicātave"],
									"accusative": ["abdicātamve"],
									"genitive": ["abdicātaeve"],
									"dative": ["abdicātaeve"],
									"ablative": ["abdicātāve"]
								},
								"plural": {
									"nominative": ["abdicātaeve"],
									"vocative": ["abdicātaeve"],
									"accusative": ["abdicātāsve"],
									"genitive": ["abdicātārumve"],
									"dative": ["abdicātīsve"],
									"ablative": ["abdicātīsve"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdicātumve"],
									"vocative": ["abdicātumve"],
									"accusative": ["abdicātumve"],
									"genitive": ["abdicātīve"],
									"dative": ["abdicātōve"],
									"ablative": ["abdicātōve"]
								},
								"plural": {
									"nominative": ["abdicātave"],
									"vocative": ["abdicātave"],
									"accusative": ["abdicātave"],
									"genitive": ["abdicātōrumve"],
									"dative": ["abdicātīsve"],
									"ablative": ["abdicātīsve"]
								}
							}
						},
						"future": {
							"masculine": {
								"singular": {
									"nominative": ["abdicandusve"],
									"vocative": ["abdicandeve"],
									"accusative": ["abdicandumve"],
									"genitive": ["abdicandīve"],
									"dative": ["abdicandōve"],
									"ablative": ["abdicandōve"]
								},
								"plural": {
									"nominative": ["abdicandīve"],
									"vocative": ["abdicandīve"],
									"accusative": ["abdicandōsve"],
									"genitive": ["abdicandōrumve"],
									"dative": ["abdicandīsve"],
									"ablative": ["abdicandīsve"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicandave"],
									"vocative": ["abdicandave"],
									"accusative": ["abdicandamve"],
									"genitive": ["abdicandaeve"],
									"dative": ["abdicandaeve"],
									"ablative": ["abdicandāve"]
								},
								"plural": {
									"nominative": ["abdicandaeve"],
									"vocative": ["abdicandaeve"],
									"accusative": ["abdicandāsve"],
									"genitive": ["abdicandārumve"],
									"dative": ["abdicandīsve"],
									"ablative": ["abdicandīsve"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdicandumve"],
									"vocative": ["abdicandumve"],
									"accusative": ["abdicandumve"],
									"genitive": ["abdicandīve"],
									"dative": ["abdicandōve"],
									"ablative": ["abdicandōve"]
								},
								"plural": {
									"nominative": ["abdicandave"],
									"vocative": ["abdicandave"],
									"accusative": ["abdicandave"],
									"genitive": ["abdicandōrumve"],
									"dative": ["abdicandīsve"],
									"ablative": ["abdicandīsve"]
								}
							}
						}
					}
				},
				"gerund": {
					"accusative": ["abdicandumve"],
					"genitive": ["abdicandīve"],
					"dative": ["abdicandōve"],
					"ablative": ["abdicandōve"]
				},
				"supine": {
					"accusative": ["abdicātumve"],
					"ablative": ["abdicātūve"]
				}
			}
		}
	},
	{
		Input: {
			"Lemma": "abdīcō",
			"PartOfSpeech": "Verb",
			"Meanings": "deny (an omen or right)",
			"Conjugations": [3],
			"PerfectStems": ["abdīx"],
			"SupineStems": ["abdict"],
			"ReplacementForms": {
				"imperative": {
					"active": {
						"present": {
							"singular": {
								"second": ["abdīc"]
							}
						}
					}
				}
			}
		},
		Expected: {
			"unencliticized": {
				"indicative": {
					"active": {
						"present": {
							"singular": {
								"first": ["abdīcō"],
								"second": ["abdīcis"],
								"third": ["abdīcit"]
							},
							"plural": {
								"first": ["abdīcimus"],
								"second": ["abdīcitis"],
								"third": ["abdīcunt"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdīcēbam"],
								"second": ["abdīcēbās"],
								"third": ["abdīcēbat"]
							},
							"plural": {
								"first": ["abdīcēbāmus"],
								"second": ["abdīcēbātis"],
								"third": ["abdīcēbant"]
							}
						},
						"future": {
							"singular": {
								"first": ["abdīcam"],
								"second": ["abdīcēs"],
								"third": ["abdīcet"]
							},
							"plural": {
								"first": ["abdīcēmus"],
								"second": ["abdīcētis"],
								"third": ["abdīcent"]
							}
						},
						"perfect": {
							"singular": {
								"first": ["abdīxī"],
								"second": ["abdīxistī"],
								"third": ["abdīxit"]
							},
							"plural": {
								"first": ["abdīximus"],
								"second": ["abdīxistis"],
								"third": ["abdīxērunt", "abdīxēre"]
							}
						},
						"pluperfect": {
							"singular": {
								"first": ["abdīxeram"],
								"second": ["abdīxerās"],
								"third": ["abdīxerat"]
							},
							"plural": {
								"first": ["abdīxerāmus"],
								"second": ["abdīxerātis"],
								"third": ["abdīxerant"]
							}
						},
						"futureperfect": {
							"singular": {
								"first": ["abdīxerō"],
								"second": ["abdīxeris"],
								"third": ["abdīxerit"]
							},
							"plural": {
								"first": ["abdīxerimus"],
								"second": ["abdīxeritis"],
								"third": ["abdīxerint"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"first": ["abdīcor"],
								"second": ["abdīceris", "abdīcere"],
								"third": ["abdīcitur"]
							},
							"plural": {
								"first": ["abdīcimur"],
								"second": ["abdīciminī"],
								"third": ["abdīcuntur"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdīcēbar"],
								"second": ["abdīcēbāris", "abdīcēbāre"],
								"third": ["abdīcēbātur"]
							},
							"plural": {
								"first": ["abdīcēbāmur"],
								"second": ["abdīcēbāminī"],
								"third": ["abdīcēbantur"]
							}
						},
						"future": {
							"singular": {
								"first": ["abdīcar"],
								"second": ["abdīcēris", "abdīcēre"],
								"third": ["abdīcētur"]
							},
							"plural": {
								"first": ["abdīcēmur"],
								"second": ["abdīcēminī"],
								"third": ["abdīcentur"]
							}
						}
					}
				},
				"subjunctive": {
					"active": {
						"present": {
							"singular": {
								"first": ["abdīcam"],
								"second": ["abdīcās"],
								"third": ["abdīcat"]
							},
							"plural": {
								"first": ["abdīcāmus"],
								"second": ["abdīcātis"],
								"third": ["abdīcant"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdīcerem"],
								"second": ["abdīcerēs"],
								"third": ["abdīceret"]
							},
							"plural": {
								"first": ["abdīcerēmus"],
								"second": ["abdīcerētis"],
								"third": ["abdīcerent"]
							}
						},
						"perfect": {
							"singular": {
								"first": ["abdīxerim"],
								"second": ["abdīxerīs"],
								"third": ["abdīxerit"]
							},
							"plural": {
								"first": ["abdīxerīmus"],
								"second": ["abdīxerītis"],
								"third": ["abdīxerint"]
							}
						},
						"pluperfect": {
							"singular": {
								"first": ["abdīxissem"],
								"second": ["abdīxissēs"],
								"third": ["abdīxisset"]
							},
							"plural": {
								"first": ["abdīxissēmus"],
								"second": ["abdīxissētis"],
								"third": ["abdīxissent"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"first": ["abdīcar"],
								"second": ["abdīcāris", "abdīcāre"],
								"third": ["abdīcātur"]
							},
							"plural": {
								"first": ["abdīcāmur"],
								"second": ["abdīcāminī"],
								"third": ["abdīcantur"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdīcerer"],
								"second": ["abdīcerēris", "abdīcerēre"],
								"third": ["abdīcerētur"]
							},
							"plural": {
								"first": ["abdīcerēmur"],
								"second": ["abdīcerēminī"],
								"third": ["abdīcerentur"]
							}
						}
					}
				},
				"imperative": {
					"active": {
						"present": {
							"singular": {
								"second": ["abdīc"]
							},
							"plural": {
								"third": ["abdīcite"]
							}
						},
						"future": {
							"singular": {
								"second": ["abdīcitō"],
								"third": ["abdīcitō"]
							},
							"plural": {
								"second": ["abdīcitōte"],
								"third": ["abdīcuntō"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"second": ["abdīcere"]
							},
							"plural": {
								"third": ["abdīciminī"]
							}
						},
						"future": {
							"singular": {
								"second": ["abdīcitor"],
								"third": ["abdīcitor"]
							},
							"plural": {
								"third": ["abdīcuntor"]
							}
						}
					}
				},
				"infinitive": {
					"active": {
						"present": ["abdīcere"],
						"past": ["abdīxisse"]
					},
					"passive": {
						"present": ["abdīcī"]
					}
				},
				"participle": {
					"active": {
						"present": {
							"masculine": {
								"singular": {
									"nominative": ["abdīcēns"],
									"vocative": ["abdīcēns"],
									"accusative": ["abdīcentem"],
									"genitive": ["abdīcentis"],
									"dative": ["abdīcentī"],
									"ablative": ["abdīcente"]
								},
								"plural": {
									"nominative": ["abdīcentēs"],
									"vocative": ["abdīcentēs"],
									"accusative": ["abdīcentēs", "abdīcentīs"],
									"genitive": ["abdīcentium"],
									"dative": ["abdīcentibus"],
									"ablative": ["abdīcentibus"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdīcēns"],
									"vocative": ["abdīcēns"],
									"accusative": ["abdīcentem"],
									"genitive": ["abdīcentis"],
									"dative": ["abdīcentī"],
									"ablative": ["abdīcente"]
								},
								"plural": {
									"nominative": ["abdīcentēs"],
									"vocative": ["abdīcentēs"],
									"accusative": ["abdīcentēs", "abdīcentīs"],
									"genitive": ["abdīcentium"],
									"dative": ["abdīcentibus"],
									"ablative": ["abdīcentibus"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdīcēns"],
									"vocative": ["abdīcēns"],
									"accusative": ["abdīcēns"],
									"genitive": ["abdīcentis"],
									"dative": ["abdīcentī"],
									"ablative": ["abdīcente"]
								},
								"plural": {
									"nominative": ["abdīcentia"],
									"vocative": ["abdīcentia"],
									"accusative": ["abdīcentia"],
									"genitive": ["abdīcentium"],
									"dative": ["abdīcentibus"],
									"ablative": ["abdīcentibus"]
								}
							}
						},
						"future": {
							"masculine": {
								"singular": {
									"nominative": ["abdictūrus"],
									"vocative": ["abdictūre"],
									"accusative": ["abdictūrum"],
									"genitive": ["abdictūrī"],
									"dative": ["abdictūrō"],
									"ablative": ["abdictūrō"]
								},
								"plural": {
									"nominative": ["abdictūrī"],
									"vocative": ["abdictūrī"],
									"accusative": ["abdictūrōs"],
									"genitive": ["abdictūrōrum"],
									"dative": ["abdictūrīs"],
									"ablative": ["abdictūrīs"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdictūra"],
									"vocative": ["abdictūra"],
									"accusative": ["abdictūram"],
									"genitive": ["abdictūrae"],
									"dative": ["abdictūrae"],
									"ablative": ["abdictūrā"]
								},
								"plural": {
									"nominative": ["abdictūrae"],
									"vocative": ["abdictūrae"],
									"accusative": ["abdictūrās"],
									"genitive": ["abdictūrārum"],
									"dative": ["abdictūrīs"],
									"ablative": ["abdictūrīs"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdictūrum"],
									"vocative": ["abdictūrum"],
									"accusative": ["abdictūrum"],
									"genitive": ["abdictūrī"],
									"dative": ["abdictūrō"],
									"ablative": ["abdictūrō"]
								},
								"plural": {
									"nominative": ["abdictūra"],
									"vocative": ["abdictūra"],
									"accusative": ["abdictūra"],
									"genitive": ["abdictūrōrum"],
									"dative": ["abdictūrīs"],
									"ablative": ["abdictūrīs"]
								}
							}
						}
					},
					"passive": {
						"past": {
							"masculine": {
								"singular": {
									"nominative": ["abdictus"],
									"vocative": ["abdicte"],
									"accusative": ["abdictum"],
									"genitive": ["abdictī"],
									"dative": ["abdictō"],
									"ablative": ["abdictō"]
								},
								"plural": {
									"nominative": ["abdictī"],
									"vocative": ["abdictī"],
									"accusative": ["abdictōs"],
									"genitive": ["abdictōrum"],
									"dative": ["abdictīs"],
									"ablative": ["abdictīs"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdicta"],
									"vocative": ["abdicta"],
									"accusative": ["abdictam"],
									"genitive": ["abdictae"],
									"dative": ["abdictae"],
									"ablative": ["abdictā"]
								},
								"plural": {
									"nominative": ["abdictae"],
									"vocative": ["abdictae"],
									"accusative": ["abdictās"],
									"genitive": ["abdictārum"],
									"dative": ["abdictīs"],
									"ablative": ["abdictīs"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdictum"],
									"vocative": ["abdictum"],
									"accusative": ["abdictum"],
									"genitive": ["abdictī"],
									"dative": ["abdictō"],
									"ablative": ["abdictō"]
								},
								"plural": {
									"nominative": ["abdicta"],
									"vocative": ["abdicta"],
									"accusative": ["abdicta"],
									"genitive": ["abdictōrum"],
									"dative": ["abdictīs"],
									"ablative": ["abdictīs"]
								}
							}
						},
						"future": {
							"masculine": {
								"singular": {
									"nominative": ["abdīcendus"],
									"vocative": ["abdīcende"],
									"accusative": ["abdīcendum"],
									"genitive": ["abdīcendī"],
									"dative": ["abdīcendō"],
									"ablative": ["abdīcendō"]
								},
								"plural": {
									"nominative": ["abdīcendī"],
									"vocative": ["abdīcendī"],
									"accusative": ["abdīcendōs"],
									"genitive": ["abdīcendōrum"],
									"dative": ["abdīcendīs"],
									"ablative": ["abdīcendīs"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdīcenda"],
									"vocative": ["abdīcenda"],
									"accusative": ["abdīcendam"],
									"genitive": ["abdīcendae"],
									"dative": ["abdīcendae"],
									"ablative": ["abdīcendā"]
								},
								"plural": {
									"nominative": ["abdīcendae"],
									"vocative": ["abdīcendae"],
									"accusative": ["abdīcendās"],
									"genitive": ["abdīcendārum"],
									"dative": ["abdīcendīs"],
									"ablative": ["abdīcendīs"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdīcendum"],
									"vocative": ["abdīcendum"],
									"accusative": ["abdīcendum"],
									"genitive": ["abdīcendī"],
									"dative": ["abdīcendō"],
									"ablative": ["abdīcendō"]
								},
								"plural": {
									"nominative": ["abdīcenda"],
									"vocative": ["abdīcenda"],
									"accusative": ["abdīcenda"],
									"genitive": ["abdīcendōrum"],
									"dative": ["abdīcendīs"],
									"ablative": ["abdīcendīs"]
								}
							}
						}
					}
				},
				"gerund": {
					"accusative": ["abdīcendum"],
					"genitive": ["abdīcendī"],
					"dative": ["abdīcendō"],
					"ablative": ["abdīcendō"]
				},
				"supine": {
					"accusative": ["abdictum"],
					"ablative": ["abdictū"]
				}
			},
			"ne": {
				"indicative": {
					"active": {
						"present": {
							"singular": {
								"first": ["abdīcōne"],
								"second": ["abdīcisne"],
								"third": ["abdīcitne"]
							},
							"plural": {
								"first": ["abdīcimusne"],
								"second": ["abdīcitisne"],
								"third": ["abdīcuntne"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdīcēbamne"],
								"second": ["abdīcēbāsne"],
								"third": ["abdīcēbatne"]
							},
							"plural": {
								"first": ["abdīcēbāmusne"],
								"second": ["abdīcēbātisne"],
								"third": ["abdīcēbantne"]
							}
						},
						"future": {
							"singular": {
								"first": ["abdīcamne"],
								"second": ["abdīcēsne"],
								"third": ["abdīcetne"]
							},
							"plural": {
								"first": ["abdīcēmusne"],
								"second": ["abdīcētisne"],
								"third": ["abdīcentne"]
							}
						},
						"perfect": {
							"singular": {
								"first": ["abdīxīne"],
								"second": ["abdīxistīne"],
								"third": ["abdīxitne"]
							},
							"plural": {
								"first": ["abdīximusne"],
								"second": ["abdīxistisne"],
								"third": ["abdīxēruntne", "abdīxērene"]
							}
						},
						"pluperfect": {
							"singular": {
								"first": ["abdīxeramne"],
								"second": ["abdīxerāsne"],
								"third": ["abdīxeratne"]
							},
							"plural": {
								"first": ["abdīxerāmusne"],
								"second": ["abdīxerātisne"],
								"third": ["abdīxerantne"]
							}
						},
						"futureperfect": {
							"singular": {
								"first": ["abdīxerōne"],
								"second": ["abdīxerisne"],
								"third": ["abdīxeritne"]
							},
							"plural": {
								"first": ["abdīxerimusne"],
								"second": ["abdīxeritisne"],
								"third": ["abdīxerintne"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"first": ["abdīcorne"],
								"second": ["abdīcerisne", "abdīcerene"],
								"third": ["abdīciturne"]
							},
							"plural": {
								"first": ["abdīcimurne"],
								"second": ["abdīciminīne"],
								"third": ["abdīcunturne"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdīcēbarne"],
								"second": ["abdīcēbārisne", "abdīcēbārene"],
								"third": ["abdīcēbāturne"]
							},
							"plural": {
								"first": ["abdīcēbāmurne"],
								"second": ["abdīcēbāminīne"],
								"third": ["abdīcēbanturne"]
							}
						},
						"future": {
							"singular": {
								"first": ["abdīcarne"],
								"second": ["abdīcērisne", "abdīcērene"],
								"third": ["abdīcēturne"]
							},
							"plural": {
								"first": ["abdīcēmurne"],
								"second": ["abdīcēminīne"],
								"third": ["abdīcenturne"]
							}
						}
					}
				},
				"subjunctive": {
					"active": {
						"present": {
							"singular": {
								"first": ["abdīcamne"],
								"second": ["abdīcāsne"],
								"third": ["abdīcatne"]
							},
							"plural": {
								"first": ["abdīcāmusne"],
								"second": ["abdīcātisne"],
								"third": ["abdīcantne"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdīceremne"],
								"second": ["abdīcerēsne"],
								"third": ["abdīceretne"]
							},
							"plural": {
								"first": ["abdīcerēmusne"],
								"second": ["abdīcerētisne"],
								"third": ["abdīcerentne"]
							}
						},
						"perfect": {
							"singular": {
								"first": ["abdīxerimne"],
								"second": ["abdīxerīsne"],
								"third": ["abdīxeritne"]
							},
							"plural": {
								"first": ["abdīxerīmusne"],
								"second": ["abdīxerītisne"],
								"third": ["abdīxerintne"]
							}
						},
						"pluperfect": {
							"singular": {
								"first": ["abdīxissemne"],
								"second": ["abdīxissēsne"],
								"third": ["abdīxissetne"]
							},
							"plural": {
								"first": ["abdīxissēmusne"],
								"second": ["abdīxissētisne"],
								"third": ["abdīxissentne"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"first": ["abdīcarne"],
								"second": ["abdīcārisne", "abdīcārene"],
								"third": ["abdīcāturne"]
							},
							"plural": {
								"first": ["abdīcāmurne"],
								"second": ["abdīcāminīne"],
								"third": ["abdīcanturne"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdīcererne"],
								"second": ["abdīcerērisne", "abdīcerērene"],
								"third": ["abdīcerēturne"]
							},
							"plural": {
								"first": ["abdīcerēmurne"],
								"second": ["abdīcerēminīne"],
								"third": ["abdīcerenturne"]
							}
						}
					}
				},
				"imperative": {
					"active": {
						"present": {
							"singular": {
								"second": ["abdīcne"]
							},
							"plural": {
								"third": ["abdīcitene"]
							}
						},
						"future": {
							"singular": {
								"second": ["abdīcitōne"],
								"third": ["abdīcitōne"]
							},
							"plural": {
								"second": ["abdīcitōtene"],
								"third": ["abdīcuntōne"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"second": ["abdīcerene"]
							},
							"plural": {
								"third": ["abdīciminīne"]
							}
						},
						"future": {
							"singular": {
								"second": ["abdīcitorne"],
								"third": ["abdīcitorne"]
							},
							"plural": {
								"third": ["abdīcuntorne"]
							}
						}
					}
				},
				"infinitive": {
					"active": {
						"present": ["abdīcerene"],
						"past": ["abdīxissene"]
					},
					"passive": {
						"present": ["abdīcīne"]
					}
				},
				"participle": {
					"active": {
						"present": {
							"masculine": {
								"singular": {
									"nominative": ["abdīcēnsne"],
									"vocative": ["abdīcēnsne"],
									"accusative": ["abdīcentemne"],
									"genitive": ["abdīcentisne"],
									"dative": ["abdīcentīne"],
									"ablative": ["abdīcentene"]
								},
								"plural": {
									"nominative": ["abdīcentēsne"],
									"vocative": ["abdīcentēsne"],
									"accusative": ["abdīcentēsne", "abdīcentīsne"],
									"genitive": ["abdīcentiumne"],
									"dative": ["abdīcentibusne"],
									"ablative": ["abdīcentibusne"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdīcēnsne"],
									"vocative": ["abdīcēnsne"],
									"accusative": ["abdīcentemne"],
									"genitive": ["abdīcentisne"],
									"dative": ["abdīcentīne"],
									"ablative": ["abdīcentene"]
								},
								"plural": {
									"nominative": ["abdīcentēsne"],
									"vocative": ["abdīcentēsne"],
									"accusative": ["abdīcentēsne", "abdīcentīsne"],
									"genitive": ["abdīcentiumne"],
									"dative": ["abdīcentibusne"],
									"ablative": ["abdīcentibusne"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdīcēnsne"],
									"vocative": ["abdīcēnsne"],
									"accusative": ["abdīcēnsne"],
									"genitive": ["abdīcentisne"],
									"dative": ["abdīcentīne"],
									"ablative": ["abdīcentene"]
								},
								"plural": {
									"nominative": ["abdīcentiane"],
									"vocative": ["abdīcentiane"],
									"accusative": ["abdīcentiane"],
									"genitive": ["abdīcentiumne"],
									"dative": ["abdīcentibusne"],
									"ablative": ["abdīcentibusne"]
								}
							}
						},
						"future": {
							"masculine": {
								"singular": {
									"nominative": ["abdictūrusne"],
									"vocative": ["abdictūrene"],
									"accusative": ["abdictūrumne"],
									"genitive": ["abdictūrīne"],
									"dative": ["abdictūrōne"],
									"ablative": ["abdictūrōne"]
								},
								"plural": {
									"nominative": ["abdictūrīne"],
									"vocative": ["abdictūrīne"],
									"accusative": ["abdictūrōsne"],
									"genitive": ["abdictūrōrumne"],
									"dative": ["abdictūrīsne"],
									"ablative": ["abdictūrīsne"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdictūrane"],
									"vocative": ["abdictūrane"],
									"accusative": ["abdictūramne"],
									"genitive": ["abdictūraene"],
									"dative": ["abdictūraene"],
									"ablative": ["abdictūrāne"]
								},
								"plural": {
									"nominative": ["abdictūraene"],
									"vocative": ["abdictūraene"],
									"accusative": ["abdictūrāsne"],
									"genitive": ["abdictūrārumne"],
									"dative": ["abdictūrīsne"],
									"ablative": ["abdictūrīsne"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdictūrumne"],
									"vocative": ["abdictūrumne"],
									"accusative": ["abdictūrumne"],
									"genitive": ["abdictūrīne"],
									"dative": ["abdictūrōne"],
									"ablative": ["abdictūrōne"]
								},
								"plural": {
									"nominative": ["abdictūrane"],
									"vocative": ["abdictūrane"],
									"accusative": ["abdictūrane"],
									"genitive": ["abdictūrōrumne"],
									"dative": ["abdictūrīsne"],
									"ablative": ["abdictūrīsne"]
								}
							}
						}
					},
					"passive": {
						"past": {
							"masculine": {
								"singular": {
									"nominative": ["abdictusne"],
									"vocative": ["abdictene"],
									"accusative": ["abdictumne"],
									"genitive": ["abdictīne"],
									"dative": ["abdictōne"],
									"ablative": ["abdictōne"]
								},
								"plural": {
									"nominative": ["abdictīne"],
									"vocative": ["abdictīne"],
									"accusative": ["abdictōsne"],
									"genitive": ["abdictōrumne"],
									"dative": ["abdictīsne"],
									"ablative": ["abdictīsne"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdictane"],
									"vocative": ["abdictane"],
									"accusative": ["abdictamne"],
									"genitive": ["abdictaene"],
									"dative": ["abdictaene"],
									"ablative": ["abdictāne"]
								},
								"plural": {
									"nominative": ["abdictaene"],
									"vocative": ["abdictaene"],
									"accusative": ["abdictāsne"],
									"genitive": ["abdictārumne"],
									"dative": ["abdictīsne"],
									"ablative": ["abdictīsne"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdictumne"],
									"vocative": ["abdictumne"],
									"accusative": ["abdictumne"],
									"genitive": ["abdictīne"],
									"dative": ["abdictōne"],
									"ablative": ["abdictōne"]
								},
								"plural": {
									"nominative": ["abdictane"],
									"vocative": ["abdictane"],
									"accusative": ["abdictane"],
									"genitive": ["abdictōrumne"],
									"dative": ["abdictīsne"],
									"ablative": ["abdictīsne"]
								}
							}
						},
						"future": {
							"masculine": {
								"singular": {
									"nominative": ["abdīcendusne"],
									"vocative": ["abdīcendene"],
									"accusative": ["abdīcendumne"],
									"genitive": ["abdīcendīne"],
									"dative": ["abdīcendōne"],
									"ablative": ["abdīcendōne"]
								},
								"plural": {
									"nominative": ["abdīcendīne"],
									"vocative": ["abdīcendīne"],
									"accusative": ["abdīcendōsne"],
									"genitive": ["abdīcendōrumne"],
									"dative": ["abdīcendīsne"],
									"ablative": ["abdīcendīsne"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdīcendane"],
									"vocative": ["abdīcendane"],
									"accusative": ["abdīcendamne"],
									"genitive": ["abdīcendaene"],
									"dative": ["abdīcendaene"],
									"ablative": ["abdīcendāne"]
								},
								"plural": {
									"nominative": ["abdīcendaene"],
									"vocative": ["abdīcendaene"],
									"accusative": ["abdīcendāsne"],
									"genitive": ["abdīcendārumne"],
									"dative": ["abdīcendīsne"],
									"ablative": ["abdīcendīsne"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdīcendumne"],
									"vocative": ["abdīcendumne"],
									"accusative": ["abdīcendumne"],
									"genitive": ["abdīcendīne"],
									"dative": ["abdīcendōne"],
									"ablative": ["abdīcendōne"]
								},
								"plural": {
									"nominative": ["abdīcendane"],
									"vocative": ["abdīcendane"],
									"accusative": ["abdīcendane"],
									"genitive": ["abdīcendōrumne"],
									"dative": ["abdīcendīsne"],
									"ablative": ["abdīcendīsne"]
								}
							}
						}
					}
				},
				"gerund": {
					"accusative": ["abdīcendumne"],
					"genitive": ["abdīcendīne"],
					"dative": ["abdīcendōne"],
					"ablative": ["abdīcendōne"]
				},
				"supine": {
					"accusative": ["abdictumne"],
					"ablative": ["abdictūne"]
				}
			},
			"que": {
				"indicative": {
					"active": {
						"present": {
							"singular": {
								"first": ["abdīcōque"],
								"second": ["abdīcisque"],
								"third": ["abdīcitque"]
							},
							"plural": {
								"first": ["abdīcimusque"],
								"second": ["abdīcitisque"],
								"third": ["abdīcuntque"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdīcēbamque"],
								"second": ["abdīcēbāsque"],
								"third": ["abdīcēbatque"]
							},
							"plural": {
								"first": ["abdīcēbāmusque"],
								"second": ["abdīcēbātisque"],
								"third": ["abdīcēbantque"]
							}
						},
						"future": {
							"singular": {
								"first": ["abdīcamque"],
								"second": ["abdīcēsque"],
								"third": ["abdīcetque"]
							},
							"plural": {
								"first": ["abdīcēmusque"],
								"second": ["abdīcētisque"],
								"third": ["abdīcentque"]
							}
						},
						"perfect": {
							"singular": {
								"first": ["abdīxīque"],
								"second": ["abdīxistīque"],
								"third": ["abdīxitque"]
							},
							"plural": {
								"first": ["abdīximusque"],
								"second": ["abdīxistisque"],
								"third": ["abdīxēruntque", "abdīxēreque"]
							}
						},
						"pluperfect": {
							"singular": {
								"first": ["abdīxeramque"],
								"second": ["abdīxerāsque"],
								"third": ["abdīxeratque"]
							},
							"plural": {
								"first": ["abdīxerāmusque"],
								"second": ["abdīxerātisque"],
								"third": ["abdīxerantque"]
							}
						},
						"futureperfect": {
							"singular": {
								"first": ["abdīxerōque"],
								"second": ["abdīxerisque"],
								"third": ["abdīxeritque"]
							},
							"plural": {
								"first": ["abdīxerimusque"],
								"second": ["abdīxeritisque"],
								"third": ["abdīxerintque"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"first": ["abdīcorque"],
								"second": ["abdīcerisque", "abdīcereque"],
								"third": ["abdīciturque"]
							},
							"plural": {
								"first": ["abdīcimurque"],
								"second": ["abdīciminīque"],
								"third": ["abdīcunturque"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdīcēbarque"],
								"second": ["abdīcēbārisque", "abdīcēbāreque"],
								"third": ["abdīcēbāturque"]
							},
							"plural": {
								"first": ["abdīcēbāmurque"],
								"second": ["abdīcēbāminīque"],
								"third": ["abdīcēbanturque"]
							}
						},
						"future": {
							"singular": {
								"first": ["abdīcarque"],
								"second": ["abdīcērisque", "abdīcēreque"],
								"third": ["abdīcēturque"]
							},
							"plural": {
								"first": ["abdīcēmurque"],
								"second": ["abdīcēminīque"],
								"third": ["abdīcenturque"]
							}
						}
					}
				},
				"subjunctive": {
					"active": {
						"present": {
							"singular": {
								"first": ["abdīcamque"],
								"second": ["abdīcāsque"],
								"third": ["abdīcatque"]
							},
							"plural": {
								"first": ["abdīcāmusque"],
								"second": ["abdīcātisque"],
								"third": ["abdīcantque"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdīceremque"],
								"second": ["abdīcerēsque"],
								"third": ["abdīceretque"]
							},
							"plural": {
								"first": ["abdīcerēmusque"],
								"second": ["abdīcerētisque"],
								"third": ["abdīcerentque"]
							}
						},
						"perfect": {
							"singular": {
								"first": ["abdīxerimque"],
								"second": ["abdīxerīsque"],
								"third": ["abdīxeritque"]
							},
							"plural": {
								"first": ["abdīxerīmusque"],
								"second": ["abdīxerītisque"],
								"third": ["abdīxerintque"]
							}
						},
						"pluperfect": {
							"singular": {
								"first": ["abdīxissemque"],
								"second": ["abdīxissēsque"],
								"third": ["abdīxissetque"]
							},
							"plural": {
								"first": ["abdīxissēmusque"],
								"second": ["abdīxissētisque"],
								"third": ["abdīxissentque"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"first": ["abdīcarque"],
								"second": ["abdīcārisque", "abdīcāreque"],
								"third": ["abdīcāturque"]
							},
							"plural": {
								"first": ["abdīcāmurque"],
								"second": ["abdīcāminīque"],
								"third": ["abdīcanturque"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdīcererque"],
								"second": ["abdīcerērisque", "abdīcerēreque"],
								"third": ["abdīcerēturque"]
							},
							"plural": {
								"first": ["abdīcerēmurque"],
								"second": ["abdīcerēminīque"],
								"third": ["abdīcerenturque"]
							}
						}
					}
				},
				"imperative": {
					"active": {
						"present": {
							"singular": {
								"second": ["abdīcque"]
							},
							"plural": {
								"third": ["abdīciteque"]
							}
						},
						"future": {
							"singular": {
								"second": ["abdīcitōque"],
								"third": ["abdīcitōque"]
							},
							"plural": {
								"second": ["abdīcitōteque"],
								"third": ["abdīcuntōque"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"second": ["abdīcereque"]
							},
							"plural": {
								"third": ["abdīciminīque"]
							}
						},
						"future": {
							"singular": {
								"second": ["abdīcitorque"],
								"third": ["abdīcitorque"]
							},
							"plural": {
								"third": ["abdīcuntorque"]
							}
						}
					}
				},
				"infinitive": {
					"active": {
						"present": ["abdīcereque"],
						"past": ["abdīxisseque"]
					},
					"passive": {
						"present": ["abdīcīque"]
					}
				},
				"participle": {
					"active": {
						"present": {
							"masculine": {
								"singular": {
									"nominative": ["abdīcēnsque"],
									"vocative": ["abdīcēnsque"],
									"accusative": ["abdīcentemque"],
									"genitive": ["abdīcentisque"],
									"dative": ["abdīcentīque"],
									"ablative": ["abdīcenteque"]
								},
								"plural": {
									"nominative": ["abdīcentēsque"],
									"vocative": ["abdīcentēsque"],
									"accusative": ["abdīcentēsque", "abdīcentīsque"],
									"genitive": ["abdīcentiumque"],
									"dative": ["abdīcentibusque"],
									"ablative": ["abdīcentibusque"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdīcēnsque"],
									"vocative": ["abdīcēnsque"],
									"accusative": ["abdīcentemque"],
									"genitive": ["abdīcentisque"],
									"dative": ["abdīcentīque"],
									"ablative": ["abdīcenteque"]
								},
								"plural": {
									"nominative": ["abdīcentēsque"],
									"vocative": ["abdīcentēsque"],
									"accusative": ["abdīcentēsque", "abdīcentīsque"],
									"genitive": ["abdīcentiumque"],
									"dative": ["abdīcentibusque"],
									"ablative": ["abdīcentibusque"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdīcēnsque"],
									"vocative": ["abdīcēnsque"],
									"accusative": ["abdīcēnsque"],
									"genitive": ["abdīcentisque"],
									"dative": ["abdīcentīque"],
									"ablative": ["abdīcenteque"]
								},
								"plural": {
									"nominative": ["abdīcentiaque"],
									"vocative": ["abdīcentiaque"],
									"accusative": ["abdīcentiaque"],
									"genitive": ["abdīcentiumque"],
									"dative": ["abdīcentibusque"],
									"ablative": ["abdīcentibusque"]
								}
							}
						},
						"future": {
							"masculine": {
								"singular": {
									"nominative": ["abdictūrusque"],
									"vocative": ["abdictūreque"],
									"accusative": ["abdictūrumque"],
									"genitive": ["abdictūrīque"],
									"dative": ["abdictūrōque"],
									"ablative": ["abdictūrōque"]
								},
								"plural": {
									"nominative": ["abdictūrīque"],
									"vocative": ["abdictūrīque"],
									"accusative": ["abdictūrōsque"],
									"genitive": ["abdictūrōrumque"],
									"dative": ["abdictūrīsque"],
									"ablative": ["abdictūrīsque"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdictūraque"],
									"vocative": ["abdictūraque"],
									"accusative": ["abdictūramque"],
									"genitive": ["abdictūraeque"],
									"dative": ["abdictūraeque"],
									"ablative": ["abdictūrāque"]
								},
								"plural": {
									"nominative": ["abdictūraeque"],
									"vocative": ["abdictūraeque"],
									"accusative": ["abdictūrāsque"],
									"genitive": ["abdictūrārumque"],
									"dative": ["abdictūrīsque"],
									"ablative": ["abdictūrīsque"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdictūrumque"],
									"vocative": ["abdictūrumque"],
									"accusative": ["abdictūrumque"],
									"genitive": ["abdictūrīque"],
									"dative": ["abdictūrōque"],
									"ablative": ["abdictūrōque"]
								},
								"plural": {
									"nominative": ["abdictūraque"],
									"vocative": ["abdictūraque"],
									"accusative": ["abdictūraque"],
									"genitive": ["abdictūrōrumque"],
									"dative": ["abdictūrīsque"],
									"ablative": ["abdictūrīsque"]
								}
							}
						}
					},
					"passive": {
						"past": {
							"masculine": {
								"singular": {
									"nominative": ["abdictusque"],
									"vocative": ["abdicteque"],
									"accusative": ["abdictumque"],
									"genitive": ["abdictīque"],
									"dative": ["abdictōque"],
									"ablative": ["abdictōque"]
								},
								"plural": {
									"nominative": ["abdictīque"],
									"vocative": ["abdictīque"],
									"accusative": ["abdictōsque"],
									"genitive": ["abdictōrumque"],
									"dative": ["abdictīsque"],
									"ablative": ["abdictīsque"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdictaque"],
									"vocative": ["abdictaque"],
									"accusative": ["abdictamque"],
									"genitive": ["abdictaeque"],
									"dative": ["abdictaeque"],
									"ablative": ["abdictāque"]
								},
								"plural": {
									"nominative": ["abdictaeque"],
									"vocative": ["abdictaeque"],
									"accusative": ["abdictāsque"],
									"genitive": ["abdictārumque"],
									"dative": ["abdictīsque"],
									"ablative": ["abdictīsque"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdictumque"],
									"vocative": ["abdictumque"],
									"accusative": ["abdictumque"],
									"genitive": ["abdictīque"],
									"dative": ["abdictōque"],
									"ablative": ["abdictōque"]
								},
								"plural": {
									"nominative": ["abdictaque"],
									"vocative": ["abdictaque"],
									"accusative": ["abdictaque"],
									"genitive": ["abdictōrumque"],
									"dative": ["abdictīsque"],
									"ablative": ["abdictīsque"]
								}
							}
						},
						"future": {
							"masculine": {
								"singular": {
									"nominative": ["abdīcendusque"],
									"vocative": ["abdīcendeque"],
									"accusative": ["abdīcendumque"],
									"genitive": ["abdīcendīque"],
									"dative": ["abdīcendōque"],
									"ablative": ["abdīcendōque"]
								},
								"plural": {
									"nominative": ["abdīcendīque"],
									"vocative": ["abdīcendīque"],
									"accusative": ["abdīcendōsque"],
									"genitive": ["abdīcendōrumque"],
									"dative": ["abdīcendīsque"],
									"ablative": ["abdīcendīsque"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdīcendaque"],
									"vocative": ["abdīcendaque"],
									"accusative": ["abdīcendamque"],
									"genitive": ["abdīcendaeque"],
									"dative": ["abdīcendaeque"],
									"ablative": ["abdīcendāque"]
								},
								"plural": {
									"nominative": ["abdīcendaeque"],
									"vocative": ["abdīcendaeque"],
									"accusative": ["abdīcendāsque"],
									"genitive": ["abdīcendārumque"],
									"dative": ["abdīcendīsque"],
									"ablative": ["abdīcendīsque"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdīcendumque"],
									"vocative": ["abdīcendumque"],
									"accusative": ["abdīcendumque"],
									"genitive": ["abdīcendīque"],
									"dative": ["abdīcendōque"],
									"ablative": ["abdīcendōque"]
								},
								"plural": {
									"nominative": ["abdīcendaque"],
									"vocative": ["abdīcendaque"],
									"accusative": ["abdīcendaque"],
									"genitive": ["abdīcendōrumque"],
									"dative": ["abdīcendīsque"],
									"ablative": ["abdīcendīsque"]
								}
							}
						}
					}
				},
				"gerund": {
					"accusative": ["abdīcendumque"],
					"genitive": ["abdīcendīque"],
					"dative": ["abdīcendōque"],
					"ablative": ["abdīcendōque"]
				},
				"supine": {
					"accusative": ["abdictumque"],
					"ablative": ["abdictūque"]
				}
			},
			"ve": {
				"indicative": {
					"active": {
						"present": {
							"singular": {
								"first": ["abdīcōve"],
								"second": ["abdīcisve"],
								"third": ["abdīcitve"]
							},
							"plural": {
								"first": ["abdīcimusve"],
								"second": ["abdīcitisve"],
								"third": ["abdīcuntve"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdīcēbamve"],
								"second": ["abdīcēbāsve"],
								"third": ["abdīcēbatve"]
							},
							"plural": {
								"first": ["abdīcēbāmusve"],
								"second": ["abdīcēbātisve"],
								"third": ["abdīcēbantve"]
							}
						},
						"future": {
							"singular": {
								"first": ["abdīcamve"],
								"second": ["abdīcēsve"],
								"third": ["abdīcetve"]
							},
							"plural": {
								"first": ["abdīcēmusve"],
								"second": ["abdīcētisve"],
								"third": ["abdīcentve"]
							}
						},
						"perfect": {
							"singular": {
								"first": ["abdīxīve"],
								"second": ["abdīxistīve"],
								"third": ["abdīxitve"]
							},
							"plural": {
								"first": ["abdīximusve"],
								"second": ["abdīxistisve"],
								"third": ["abdīxēruntve", "abdīxēreve"]
							}
						},
						"pluperfect": {
							"singular": {
								"first": ["abdīxeramve"],
								"second": ["abdīxerāsve"],
								"third": ["abdīxeratve"]
							},
							"plural": {
								"first": ["abdīxerāmusve"],
								"second": ["abdīxerātisve"],
								"third": ["abdīxerantve"]
							}
						},
						"futureperfect": {
							"singular": {
								"first": ["abdīxerōve"],
								"second": ["abdīxerisve"],
								"third": ["abdīxeritve"]
							},
							"plural": {
								"first": ["abdīxerimusve"],
								"second": ["abdīxeritisve"],
								"third": ["abdīxerintve"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"first": ["abdīcorve"],
								"second": ["abdīcerisve", "abdīcereve"],
								"third": ["abdīciturve"]
							},
							"plural": {
								"first": ["abdīcimurve"],
								"second": ["abdīciminīve"],
								"third": ["abdīcunturve"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdīcēbarve"],
								"second": ["abdīcēbārisve", "abdīcēbāreve"],
								"third": ["abdīcēbāturve"]
							},
							"plural": {
								"first": ["abdīcēbāmurve"],
								"second": ["abdīcēbāminīve"],
								"third": ["abdīcēbanturve"]
							}
						},
						"future": {
							"singular": {
								"first": ["abdīcarve"],
								"second": ["abdīcērisve", "abdīcēreve"],
								"third": ["abdīcēturve"]
							},
							"plural": {
								"first": ["abdīcēmurve"],
								"second": ["abdīcēminīve"],
								"third": ["abdīcenturve"]
							}
						}
					}
				},
				"subjunctive": {
					"active": {
						"present": {
							"singular": {
								"first": ["abdīcamve"],
								"second": ["abdīcāsve"],
								"third": ["abdīcatve"]
							},
							"plural": {
								"first": ["abdīcāmusve"],
								"second": ["abdīcātisve"],
								"third": ["abdīcantve"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdīceremve"],
								"second": ["abdīcerēsve"],
								"third": ["abdīceretve"]
							},
							"plural": {
								"first": ["abdīcerēmusve"],
								"second": ["abdīcerētisve"],
								"third": ["abdīcerentve"]
							}
						},
						"perfect": {
							"singular": {
								"first": ["abdīxerimve"],
								"second": ["abdīxerīsve"],
								"third": ["abdīxeritve"]
							},
							"plural": {
								"first": ["abdīxerīmusve"],
								"second": ["abdīxerītisve"],
								"third": ["abdīxerintve"]
							}
						},
						"pluperfect": {
							"singular": {
								"first": ["abdīxissemve"],
								"second": ["abdīxissēsve"],
								"third": ["abdīxissetve"]
							},
							"plural": {
								"first": ["abdīxissēmusve"],
								"second": ["abdīxissētisve"],
								"third": ["abdīxissentve"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"first": ["abdīcarve"],
								"second": ["abdīcārisve", "abdīcāreve"],
								"third": ["abdīcāturve"]
							},
							"plural": {
								"first": ["abdīcāmurve"],
								"second": ["abdīcāminīve"],
								"third": ["abdīcanturve"]
							}
						},
						"imperfect": {
							"singular": {
								"first": ["abdīcererve"],
								"second": ["abdīcerērisve", "abdīcerēreve"],
								"third": ["abdīcerēturve"]
							},
							"plural": {
								"first": ["abdīcerēmurve"],
								"second": ["abdīcerēminīve"],
								"third": ["abdīcerenturve"]
							}
						}
					}
				},
				"imperative": {
					"active": {
						"present": {
							"singular": {
								"second": ["abdīcve"]
							},
							"plural": {
								"third": ["abdīciteve"]
							}
						},
						"future": {
							"singular": {
								"second": ["abdīcitōve"],
								"third": ["abdīcitōve"]
							},
							"plural": {
								"second": ["abdīcitōteve"],
								"third": ["abdīcuntōve"]
							}
						}
					},
					"passive": {
						"present": {
							"singular": {
								"second": ["abdīcereve"]
							},
							"plural": {
								"third": ["abdīciminīve"]
							}
						},
						"future": {
							"singular": {
								"second": ["abdīcitorve"],
								"third": ["abdīcitorve"]
							},
							"plural": {
								"third": ["abdīcuntorve"]
							}
						}
					}
				},
				"infinitive": {
					"active": {
						"present": ["abdīcereve"],
						"past": ["abdīxisseve"]
					},
					"passive": {
						"present": ["abdīcīve"]
					}
				},
				"participle": {
					"active": {
						"present": {
							"masculine": {
								"singular": {
									"nominative": ["abdīcēnsve"],
									"vocative": ["abdīcēnsve"],
									"accusative": ["abdīcentemve"],
									"genitive": ["abdīcentisve"],
									"dative": ["abdīcentīve"],
									"ablative": ["abdīcenteve"]
								},
								"plural": {
									"nominative": ["abdīcentēsve"],
									"vocative": ["abdīcentēsve"],
									"accusative": ["abdīcentēsve", "abdīcentīsve"],
									"genitive": ["abdīcentiumve"],
									"dative": ["abdīcentibusve"],
									"ablative": ["abdīcentibusve"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdīcēnsve"],
									"vocative": ["abdīcēnsve"],
									"accusative": ["abdīcentemve"],
									"genitive": ["abdīcentisve"],
									"dative": ["abdīcentīve"],
									"ablative": ["abdīcenteve"]
								},
								"plural": {
									"nominative": ["abdīcentēsve"],
									"vocative": ["abdīcentēsve"],
									"accusative": ["abdīcentēsve", "abdīcentīsve"],
									"genitive": ["abdīcentiumve"],
									"dative": ["abdīcentibusve"],
									"ablative": ["abdīcentibusve"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdīcēnsve"],
									"vocative": ["abdīcēnsve"],
									"accusative": ["abdīcēnsve"],
									"genitive": ["abdīcentisve"],
									"dative": ["abdīcentīve"],
									"ablative": ["abdīcenteve"]
								},
								"plural": {
									"nominative": ["abdīcentiave"],
									"vocative": ["abdīcentiave"],
									"accusative": ["abdīcentiave"],
									"genitive": ["abdīcentiumve"],
									"dative": ["abdīcentibusve"],
									"ablative": ["abdīcentibusve"]
								}
							}
						},
						"future": {
							"masculine": {
								"singular": {
									"nominative": ["abdictūrusve"],
									"vocative": ["abdictūreve"],
									"accusative": ["abdictūrumve"],
									"genitive": ["abdictūrīve"],
									"dative": ["abdictūrōve"],
									"ablative": ["abdictūrōve"]
								},
								"plural": {
									"nominative": ["abdictūrīve"],
									"vocative": ["abdictūrīve"],
									"accusative": ["abdictūrōsve"],
									"genitive": ["abdictūrōrumve"],
									"dative": ["abdictūrīsve"],
									"ablative": ["abdictūrīsve"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdictūrave"],
									"vocative": ["abdictūrave"],
									"accusative": ["abdictūramve"],
									"genitive": ["abdictūraeve"],
									"dative": ["abdictūraeve"],
									"ablative": ["abdictūrāve"]
								},
								"plural": {
									"nominative": ["abdictūraeve"],
									"vocative": ["abdictūraeve"],
									"accusative": ["abdictūrāsve"],
									"genitive": ["abdictūrārumve"],
									"dative": ["abdictūrīsve"],
									"ablative": ["abdictūrīsve"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdictūrumve"],
									"vocative": ["abdictūrumve"],
									"accusative": ["abdictūrumve"],
									"genitive": ["abdictūrīve"],
									"dative": ["abdictūrōve"],
									"ablative": ["abdictūrōve"]
								},
								"plural": {
									"nominative": ["abdictūrave"],
									"vocative": ["abdictūrave"],
									"accusative": ["abdictūrave"],
									"genitive": ["abdictūrōrumve"],
									"dative": ["abdictūrīsve"],
									"ablative": ["abdictūrīsve"]
								}
							}
						}
					},
					"passive": {
						"past": {
							"masculine": {
								"singular": {
									"nominative": ["abdictusve"],
									"vocative": ["abdicteve"],
									"accusative": ["abdictumve"],
									"genitive": ["abdictīve"],
									"dative": ["abdictōve"],
									"ablative": ["abdictōve"]
								},
								"plural": {
									"nominative": ["abdictīve"],
									"vocative": ["abdictīve"],
									"accusative": ["abdictōsve"],
									"genitive": ["abdictōrumve"],
									"dative": ["abdictīsve"],
									"ablative": ["abdictīsve"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdictave"],
									"vocative": ["abdictave"],
									"accusative": ["abdictamve"],
									"genitive": ["abdictaeve"],
									"dative": ["abdictaeve"],
									"ablative": ["abdictāve"]
								},
								"plural": {
									"nominative": ["abdictaeve"],
									"vocative": ["abdictaeve"],
									"accusative": ["abdictāsve"],
									"genitive": ["abdictārumve"],
									"dative": ["abdictīsve"],
									"ablative": ["abdictīsve"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdictumve"],
									"vocative": ["abdictumve"],
									"accusative": ["abdictumve"],
									"genitive": ["abdictīve"],
									"dative": ["abdictōve"],
									"ablative": ["abdictōve"]
								},
								"plural": {
									"nominative": ["abdictave"],
									"vocative": ["abdictave"],
									"accusative": ["abdictave"],
									"genitive": ["abdictōrumve"],
									"dative": ["abdictīsve"],
									"ablative": ["abdictīsve"]
								}
							}
						},
						"future": {
							"masculine": {
								"singular": {
									"nominative": ["abdīcendusve"],
									"vocative": ["abdīcendeve"],
									"accusative": ["abdīcendumve"],
									"genitive": ["abdīcendīve"],
									"dative": ["abdīcendōve"],
									"ablative": ["abdīcendōve"]
								},
								"plural": {
									"nominative": ["abdīcendīve"],
									"vocative": ["abdīcendīve"],
									"accusative": ["abdīcendōsve"],
									"genitive": ["abdīcendōrumve"],
									"dative": ["abdīcendīsve"],
									"ablative": ["abdīcendīsve"]
								}
							},
							"feminine": {
								"singular": {
									"nominative": ["abdīcendave"],
									"vocative": ["abdīcendave"],
									"accusative": ["abdīcendamve"],
									"genitive": ["abdīcendaeve"],
									"dative": ["abdīcendaeve"],
									"ablative": ["abdīcendāve"]
								},
								"plural": {
									"nominative": ["abdīcendaeve"],
									"vocative": ["abdīcendaeve"],
									"accusative": ["abdīcendāsve"],
									"genitive": ["abdīcendārumve"],
									"dative": ["abdīcendīsve"],
									"ablative": ["abdīcendīsve"]
								}
							},
							"neuter": {
								"singular": {
									"nominative": ["abdīcendumve"],
									"vocative": ["abdīcendumve"],
									"accusative": ["abdīcendumve"],
									"genitive": ["abdīcendīve"],
									"dative": ["abdīcendōve"],
									"ablative": ["abdīcendōve"]
								},
								"plural": {
									"nominative": ["abdīcendave"],
									"vocative": ["abdīcendave"],
									"accusative": ["abdīcendave"],
									"genitive": ["abdīcendōrumve"],
									"dative": ["abdīcendīsve"],
									"ablative": ["abdīcendīsve"]
								}
							}
						}
					}
				},
				"gerund": {
					"accusative": ["abdīcendumve"],
					"genitive": ["abdīcendīve"],
					"dative": ["abdīcendōve"],
					"ablative": ["abdīcendōve"]
				},
				"supine": {
					"accusative": ["abdictumve"],
					"ablative": ["abdictūve"]
				}
			}
		}
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
		console.log(`Testing ${Input.Lemma}…`);

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
