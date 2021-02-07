function collectionToArray(htmlCollection) {
	let r = [];
	for(let i = 0; i < htmlCollection.length; ++i) {
		r.push(htmlCollection[i]);
	}
	return r;
}

class SubRecord {

	constructor(kcode,type,fill) {
		this.kcode = kcode;
		this.type = type;
		this.fill = fill;
	}

}

class Scanner {

	constructor(timings = 500) {
		this.audio = new Audio("https://proxy.notificationsounds.com/message-tones/moonless-591/download/file-sounds-1138-moonless.mp3");
		this.run = false;
		this.fake = false;
		this.setInterval(timings);
	}

	printStatus() {
		console.log(this);
	}

	sleep(time) {
		return new Promise((resolve, reject) => {
			setTimeout(resolve, time);
		});
	}

	triggerFake() {
		this.fake = true;
	}

	stop() {
		this.run = false;
	}

	setInterval(interval = 500) {
		this.interval = interval;
		if(this.interval < 200) {
			console.warn("a timer nagyon gyors (< 200ms). biztos vagy ebben? átállításhoz hívd meg a 'setInterval(interval)' függvényemet");
		}
	}

	/**
	 * @returns {Map<string, SubRecord>}
	 */
	__PRIVATE_DONT_CALL_ME_querySubs() {
		let rowElements = document.querySelector("#Addsubject_course1_gridCourses_bodytable .scrollablebody").children;
		let recordMap = new Map();
		collectionToArray(rowElements).forEach(e => {
			let record = new SubRecord(e.children[1].innerText, e.children[2].innerText, e.children[3].innerText);
			recordMap.set(record.kcode, record);
		});
		return recordMap;
	}

	async __PRIVATE_DONT_CALL_ME_scanCourse(ob) {
		ob.node.click();
		let a = null;
		do {
			a = document.querySelector(".ui-dialog")
			await this.sleep(100);
		}
		while(a === null);

		let qr = this.__PRIVATE_DONT_CALL_ME_querySubs();
		if(ob.courses !== null) {
			/**
			 * @type {Map<string, SubRecord>}
			 */
			let old = ob.courses;

			//check new courses
				let addedCourses = [];
				qr.forEach(e => {
					if(!old.has(e.kcode)) {
						addedCourses.push(e);
					}
				});
				/*if(addedCourses.length != 0) {
					console.log("ÚJ KURZUS(OK) KERÜLT(EK) KIÍRÁSRA:");
					addedCourses.forEach(a => {
						console.log(" - "+a.kcode+" "+a.fill);
					});
				}*/
			//

			//check removed courses
				let removedCourses = [];
				old.forEach(e => {
					if(!qr.has(e.kcode)) {
						removedCourses.push(e);
					}
				});
				/*if(removedCourses.length != 0) {
					console.log("RÉGI KURZUS(OK) KERÜLT(EK) TÖRLÉSRE:");
					removedCourses.forEach(a => {
						console.log(" - "+a.kcode+" "+a.fill);
					});
				}*/
			//

			let changedCourses = [];

			qr.forEach(newRecord => {
				let oldVal = old.get(newRecord.kcode);
				if(oldVal === null) {
					return;
				}
				if(newRecord.fill !== oldVal.fill) {
					changedCourses.push({kcode: newRecord.kcode, oldfill: oldVal.fill, newfill: newRecord.fill});
				}
			});
			/*if(changedCourses.length != 0) {
				console.log("KURZUS LÁTSZÁM VÁLTOZÁS:")
				changedCourses.forEach(changedCourse => {
					console.log(`${changedCourse.kcode} ${changedCourse.oldfill} ==> ${changedCourse.newfill}`);
				});
			}*/
			if(changedCourses.length != 0 || removedCourses.length != 0 || this.fake) {
				if(this.fake) {
					this.fake = false;
					console.log("fake triggered")
				}

				if(addedCourses.length != 0) {
					console.log("ÚJ KURZUS(OK) KERÜLT(EK) KIÍRÁSRA:");
					addedCourses.forEach(a => {
						console.log(" - "+a.kcode+" "+a.fill);
					});
				}

				if(removedCourses.length != 0) {
					console.log("RÉGI KURZUS(OK) KERÜLT(EK) TÖRLÉSRE:");
					removedCourses.forEach(a => {
						console.log(" - "+a.kcode+" "+a.fill);
					});
				}

				if(changedCourses.length != 0) {
					console.log("KURZUS LÁTSZÁM VÁLTOZÁS:")
					changedCourses.forEach(changedCourse => {
						console.log(`${changedCourse.kcode} ${changedCourse.oldfill} ==> ${changedCourse.newfill}`);
					});
				}

				this.audio.play();
				await this.sleep(500);
				return true;
			}
		}
		ob.courses = qr;
		await this.sleep(this.interval);
		document.querySelector(".ui-dialog-titlebar-close").click();
	}

	async scan(subCodes) {
		let scanAll = false;
		if(subCodes === "*") {
			scanAll = true;
		}
		else if(arguments.length === 0) {
			console.error("HIBA: hiányzó paraméter");
			return;
		}
		else if(!Array.isArray(subCodes)) {
			console.error("HIBA: a kapott változó NEM array!");
			return;
		}
		let table = document.querySelector(".scrollablebody");
		if(table === null) {
			console.error("HIBA: a tárgy táblázat NEM található!. Meg vannak jelenítve a kurzusok?");
			return;
		}
		if(document.querySelector(".ui-dialog")) {
			document.querySelector(".ui-dialog-titlebar-close").click();
		}
		let tableChildren = table.children;
		let selectedCourseLinks = [];
	
		collectionToArray(tableChildren).forEach(child => {
			let cc = child.children;
			if(scanAll || subCodes.includes(cc[2].innerText) || subCodes.includes(cc[1].innerHTML)) {
				let link = cc[1].children.length > 0 ? cc[1].children[0] : cc[2].children[0];
				selectedCourseLinks.push({
					node: link,
					courses: null
				});
			}
		});

		if(selectedCourseLinks.length == 0) {
			console.warn("nincs találat")
			return;
		}
		this.courses = selectedCourseLinks;
		this.run = true;
		while(this.run) {
			for(let i = 0; i < selectedCourseLinks.length && this.run; ++i) {
				if(await this.__PRIVATE_DONT_CALL_ME_scanCourse(selectedCourseLinks[i])) {
					return;
				}
				await this.sleep(this.interval);
			}
		}
	}

}