const buttonTest = document.getElementById('test');

//// Data to use in tests:

const tests = [];

//// Tests looping over the above arrays:

const test = () => {
	tests.forEach(test => {
		const actual = convert(test.Lemma);
		if (actual === test.Expected) {
			console.log(`Yay! ${test.Lemma}) => ${actual}`);
		}
		else {
			console.error(`(${test.Lemma}) should give ${test.Expected} but actually gives ${actual}`);
		}
	})
}

//// Event-listener:

buttonTest.addEventListener('click', ()=>{
	test();
});
