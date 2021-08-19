function loadDataset() {
	const filesToLoad = document.getElementById('fileToImport')

	for(const fileToLoad of filesToLoad.files) {
		const reader = new FileReader()
		reader.onload = (event) => {
			onLoad(fileToLoad.name, event.target.result) // desired file content
			$('#fileToExport').attr('download', fileToLoad.name)
		}
		reader.onerror = error => {alert('Problem while reading the file.'); console.log(error)}

		reader.readAsText(fileToLoad, 'UTF-8')
		break
	}
}

function onLoad(fileName, fileContent) {
	const pickerSettings = lzwDecodeJson(fileContent)
	
	if(pickerSettings.title) {
		$('#title').text('Nesinder - ' + pickerSettings.title)
	}

	if(!('localStorageKey' in pickerSettings)) {
		pickerSettings.localStorageKey = 'nesinder-' + fileName
	}

	const itemList = []
	let i = 0
	for(const itemName in pickerSettings.items) {
		const item = pickerSettings.items[itemName]
		if(!item.name) item.name = itemName
		if(!item.id) item.id = i++
		itemList.push(item)
	}

	const p = new picker.Picker({items: itemList})
	const pickerUI = new PickerUI(p, {
		elements: {
			pick: '#pick',
			pass: '#pass',
			undo: '#undo',
			redo: '#redo',
			evaluating: '#evaluating',
			favorites: '#favorites',
			settings: {
				maxBatchSize: '#maxBatchSize'
			},
		},
		getItemImageUrl: function(item, settings) {
			return item.imgs&&item.imgs.length ? item.imgs[(Math.random()*item.imgs.length)|0] : null
		},
		onUpdate : function() {
			const total = p.state.items.length
			const eliminated = p.state.arrays.eliminated.length
			const favorites = p.state.arrays.favorites.length
			const progress = (nn2(total)-nn2(total-favorites) + eliminated) / nn2(total)

			$('#progressText').text((progress * 100).toFixed(2) + '%')
			$('#progressBar').width((progress * 100) + '%')
		}
	})

	if('state' in pickerSettings) {
		p.state.restoreState(pickerSettings.state)
	}

	$('#loader').hide()
	$('#container').show()
	$('#export').off('click').click(()=>{
		const strData = JSON.parse(JSON.stringify(pickerSettings))
		strData.state = p.state.getState()

		const blob = new Blob([lzwEncodeJson(strData)], {type: 'text/plain'})
		const link = $('#fileToExport')
		
		const efnSplit = fileName.split('\.')
		const efnEnd = efnSplit.pop()
		const exportFileName = efnSplit.join('.').replace(/_[0-9]{12}$/, '') + '_' + (new Date().toISOString().slice(0,16).replace(/[-T:.]/g,'')) + '.lzw'
		link.attr('download', exportFileName)
		link.attr('href', window.URL.createObjectURL(blob))
		console.log({exportFileName, strData, lzw: [lzwEncodeJson(strData)]})
		link[0].click()
	})
	pickerUI.initialize()
}

const nn2 = (n)=>(n*(n+1)/2)