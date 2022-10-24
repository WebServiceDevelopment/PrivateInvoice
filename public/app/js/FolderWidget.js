/**

 Apache-2.0 License
 Copyright 2020 - 2022 Web Service Development Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 Author: Ogawa Kousei (kogawa@wsd.co.jp)

**/

'use strict'

const FolderWidget = function () {
    this.MEM = {
        timeout: 2000,
        getTimeout: () => this.MEM.timeout,

        saveTimeout: null,
        getSaveTimeout: () => this.MEM.saveTimeout,
        setSaveTimeout: (timeout) => (this.MEM.saveTimeout = timeout),
        initSaveTimeout: () => (this.MEM.saveTimeout = null),

        activeFolder: null,
        setActiveFolder: (activeFolder) =>
            (this.MEM.activeFolder = activeFolder),
        getActiveFolder: () => this.MEM.activeFolder,

        leaf: null,
        setLeaf: (leaf) => (this.MEM.leaf = leaf),
        getLeaf: () => this.MEM.leaf,
    }

    const Elem = (id) => document.getElementById(id)

    this.DOM = {
        create: {
            invoice: Elem('FolderWidget.create.invoice'),
            display: () => (this.DOM.create.invoice.display = ''),
            nondisplay: () => (this.DOM.create.invoice.display = 'none'),
        },
        groups: {
            invoice_out: Elem('FolderWidget.groups.invoice_out'),
            invoice_in: Elem('FolderWidget.groups.invoice_in'),
        },
        draft: Elem('FolderWidget.groups.draft'),
        c: {
            draft: Elem('FolderWidget.c.draft'),
            sent: Elem('FolderWidget.c.sent'),
            returned: Elem('FolderWidget.c.returned'),
            confirmed: Elem('FolderWidget.c.confirmed'),
            paid: Elem('FolderWidget.c.paid'),
            complete: Elem('FolderWidget.c.complete'),
        },
        d: {
            sent: Elem('FolderWidget.d.sent'),
            returned: Elem('FolderWidget.d.returned'),
            confirmed: Elem('FolderWidget.d.confirmed'),
            paid: Elem('FolderWidget.d.paid'),
            complete: Elem('FolderWidget.d.complete'),
        },
    }

    this.EVT = {
        handleToggleClick: evt_handleToggleClick.bind(this),
        handleInvoiceCreate: evt_handleInvoiceCreate.bind(this),
        handleGroupClick: evt_handleGroupClick.bind(this),
        handleQuoteCreate: evt_handleQuoteCreate.bind(this),
    }

    this.API = {
        init: api_init.bind(this),
        openTab: api_openTab.bind(this),
        getCount: api_getCount.bind(this),
        updateInvoiceDraftCount: api_updateInvoiceDraftCount.bind(this),

        getCFolderCount: api_getCFolderCount.bind(this),
        getDFolderCount: api_getDFolderCount.bind(this),
        getDraftsFolderCount: api_getDraftsFolderCount.bind(this),
        getFolderTotal: api_getFolderTotal.bind(this),

        getActiveFolderType: api_getActiveFolderType.bind(this),
        getActiveFolderFolder: api_getActiveFolderFolder.bind(this),
        getActiveFolderRole: api_getActiveFolderRole.bind(this),
        getActiveFolderArchive: api_getActiveFolderArchive.bind(this),

        getCountOfActiveFolder: api_getCountOfActiveFolder.bind(this),

        renderFolderTotal: api_renderFolderTotal.bind(this),

        getInvoiceCount: api_getInvoiceCount.bind(this),
        getInvoiceArchiveCount: api_getInvoiceArchiveCount.bind(this),
        getCountOfCurrentFolder: api_getCountOfCurrentFolder.bind(this),
    }

    this.SIMULATE = {
        clickDraftsOfTray: simulate_clickDraftsOfTray.bind(this),
    }

    this.SERVER = {
        invoiceCreate: server_invoiceCreate.bind(this),
    }

    init.apply(this)

    return this

    function api_getCountOfCurrentFolder(folder, role, archive) {
        //console.log("1 folder="+folder+":role="+role);

        switch (role) {
            case 'seller':
                switch (folder) {
                    case 'draft':
                        return this.DOM.c.draft.innerText
                        break
                    case 'sent':
                        return this.DOM.c.sent.innerText
                        break
                    case 'confirmed':
                        return this.DOM.c.confirmed.innerText
                    case 'returned':
                        return this.DOM.c.returned.innerText
                        break
                    case 'paid':
                        if (archive == 1) {
                            return null
                        }
                        return this.DOM.c.paid.innerText
                        break
                    default:
                        return null
                        break
                }
                break
            case 'buyer':
                switch (folder) {
                    case 'draft':
                        return this.DOM.d.draft.innerText
                        break
                    case 'sent':
                        return this.DOM.d.sent.innerText
                        break
                    case 'returned':
                        return this.DOM.d.returned.innerText
                        break
                    case 'paid':
                        if (archive == 1) {
                            return null
                        }
                        return this.DOM.d.paid.innerText
                        break
                    default:
                        return null
                        break
                }
                break
        }

        return null
    }

    function api_getCountOfActiveFolder() {
        let folder = this.API.getActiveFolderFolder()
        let role = this.API.getActiveFolderRole()
        let archive = this.API.getActiveFolderArchive()

        //console.log("2 folder="+folder+":role="+role);

        switch (role) {
            case 'seller':
                switch (folder) {
                    case 'draft':
                        return this.DOM.c.draft.innerText
                        break
                    case 'sent':
                        return this.DOM.c.sent.innerText
                        break
                    case 'confirmed':
                        return this.DOM.c.confirmed.innerText
                    case 'returned':
                        return this.DOM.c.returned.innerText
                        break
                    case 'paid':
                        if (archive == 1) {
                            return null
                        }
                        return this.DOM.c.paid.innerText
                        break
                    default:
                        return null
                        break
                }
                break
            case 'buyer':
                switch (folder) {
                    case 'draft':
                        return this.DOM.d.draft.innerText
                    case 'sent':
                        return this.DOM.d.sent.innerText
                    case 'confirmed':
                        return this.DOM.d.confirmed.innerText
                    case 'returned':
                        return this.DOM.d.returned.innerText
                    case 'paid':
                        if (archive == 1) {
                            return null
                        }
                        return this.DOM.d.paid.innerText
                    default:
                        return null
                        break
                }
                break
        }

        return null
    }

    function init() {
        // Only init Events

        this.DOM.create.invoice.addEventListener(
            'click',
            this.EVT.handleInvoiceCreate
        )

        for (let key in this.DOM.toggle) {
            this.DOM.toggle[key].addEventListener(
                'click',
                this.EVT.handleToggleClick
            )
        }

        for (let key in this.DOM.groups) {
            this.DOM.groups[key].addEventListener(
                'click',
                this.EVT.handleGroupClick
            )
        }
    }

    function evt_handleQuoteCreate() {
        //console.log("quote create click!!!");

        const url = '/api/quote/create'

        let ajax = new XMLHttpRequest()
        ajax.open('POST', url)
        ajax.setRequestHeader('Content-Type', 'application/json')
        ajax.responseType = 'json'
        ajax.send()

        ajax.onload = () => {
            let res = ajax.response
            ajax = null

            if (res.err) {
                throw res.msg
            }

            //console.log(res);
        }
    }

    function api_getAFolderCount(evt) {
        const params = [
            { type: 'quote', role: 'seller', folder: 'draft', archive: 0 },
            { type: 'quote', role: 'seller', folder: 'sent', archive: 0 },
            { type: 'quote', role: 'seller', folder: 'returned', archive: 0 },
            { type: 'order', role: 'seller', folder: 'sent', archive: 0 },
            { type: 'order', role: 'seller', folder: 'prep', archive: 0 },
            { type: 'proof', role: 'seller', folder: 'sent', archive: 0 },
            { type: 'proof', role: 'seller', folder: 'confirmed', archive: 0 },
        ]

        const url = '/api/tray/getCount'

        let ajax = new XMLHttpRequest()
        ajax.open('POST', url)
        ajax.setRequestHeader('Content-Type', 'application/json')
        ajax.responseType = 'json'
        ajax.send(JSON.stringify(params))

        ajax.onload = () => {
            let res = ajax.response

            if (res.err) {
                throw res.msg
            }

            let a = this.DOM.a

            a.draft.textContent = res.msg[0]
            a.sent.textContent = res.msg[1]
            a.returned.textContent = res.msg[2]
            a.orders.textContent = res.msg[3]
            a.prep.textContent = res.msg[4]
            a.shipped.textContent = res.msg[5]
            a.delivered.textContent = res.msg[6]
        }
    }

    async function api_getBFolderCount(evt) {
        const params = [
            { type: 'quote', role: 'buyer', folder: 'sent', archive: 0 },
            { type: 'quote', role: 'buyer', folder: 'returned', archive: 0 },
            { type: 'order', role: 'buyer', folder: 'draft', archive: 0 },
            { type: 'order', role: 'buyer', folder: 'sent', archive: 0 },
            { type: 'order', role: 'buyer', folder: 'prep', archive: 0 },
            { type: 'proof', role: 'buyer', folder: 'sent', archive: 0 },
            { type: 'proof', role: 'buyer', folder: 'confirmed', archive: 0 },
        ]

        const url = '/api/tray/getCount'

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        }

        let response

        try {
            response = await fetch(url, opts)
        } catch (err) {
            throw err
        }

        let res = await response.json()
        if (res.err) {
            throw res.msg
        }

        let b = this.DOM.b

        b.sent.textContent = res.msg[0]
        b.returned.textContent = res.msg[1]
        b.draft.textContent = res.msg[2]
        b.orders.textContent = res.msg[3]
        b.prep.textContent = res.msg[4]
        b.shipped.textContent = res.msg[5]
        b.delivered.textContent = res.msg[6]
    }

    /*
     * api_getCFolderCount
     *
     * '/api/tray/getCountOfInvoice'
     */
    async function api_getCFolderCount() {
        const url = `/api/tray/getCount?archive=0&role=seller`
        let response

        try {
            response = await fetch(url)
        } catch (err) {
            console.error('Cannot connect server.')
            alert('Cannot connect server.')
            return
        }

        if (response == 'ERR_CONNECTION_REFUSED') {
            alert('Cannot connect server.')
            return
        }

        let res
        try {
            res = await response.json()
        } catch (err) {
            throw err
        }

        const counts = res
        const { c } = this.DOM
        c.sent.textContent = counts[0]
        c.returned.textContent = counts[1]
        c.confirmed.textContent = counts[2]
        c.paid.textContent = counts[3]
        c.draft.textContent = counts[4]
    }

    /*
     * api_getDFolderCount
     *
     * '/api/tray/getCount'
     */
    async function api_getDFolderCount() {
        const url = `/api/tray/getCount?archive=0&role=buyer`

        let response
        try {
            response = await fetch(url)
        } catch (err) {
            console.error('Cannot connect server.')
            alert('Cannot connect server.')
            return
        }
        if (response == 'ERR_CONNECTION_REFUSED') {
            alert('Cannot connect server.')
            return
        }

        let res
        try {
            res = await response.json()
        } catch (err) {
            throw err
        }

        const counts = res
        const { d } = this.DOM

        d.sent.textContent = counts[0]
        d.returned.textContent = counts[1]
        d.confirmed.textContent = counts[2]
        d.paid.textContent = counts[3]
    }

    /*
     * api_getDraftsFolderCount
     *
     * '/api/tray/getCount';
     */
    async function api_getDraftsFolderCount() {
        const url = `/api/tray/getCount?folder=draft`

        const opts = {
            method: 'GET',
            cache: 'no-cache',
            credentials: 'same-origin',
        }

        let response
        try {
            response = await fetch(url, opts)
        } catch (err) {
            console.error('Cannot connect server.')
            alert('Cannot connect server.')
            return
        }

        let res
        try {
            res = await response.json()
        } catch (err) {
            alert('Json Error.')
            return
        }

        this.DOM.c.draft.textContent = res[0]

        if (TrayWidget.STATUS.getActiveLi()) {
            console.log('DraftFolderCount all =' + count)

            TrayWidget.SHOWING.setAll(count)
            TrayWidget.DOM.showing.setAll(count)
        }

        //console.log("DraftFolderCount role")
    }

    async function api_updateInvoiceDraftCount() {
        await this.API.getDraftsFolderCount()

        this.SIMULATE.clickDraftsOfTray()
    }

    async function api_getInvoiceCount(count, role, folder, archive, exec) {
        console.log('getInvoiceCount')

        switch (role) {
            case 'seller':
            case 'buyer':
                break
            default:
                return
        }

        const url = `/api/tray/getCount?role=${role}&archive=${archive}&folder=${folder}`

        let response
        try {
            response = await fetch(url)
        } catch (err) {
            throw err
        }

        if (response == 'ERR_CONNECTION_REFUSED') {
            console.error('Cannot connect server.')
            alert('Cannot connect server.')
            return
        }

        let res
        try {
            res = await response.json()
        } catch (err) {
            throw err
        }

        let max = res.msg[0]

        await TrayWidget.SHOWING.setAll(max)

        await exec(parseInt(count))
    }

    async function api_getInvoiceArchiveCount(
        count,
        role,
        folder,
        archive,
        exec
    ) {
        //console.log("getInvoiceArchiveCount");
        //
        if (_argsCheck(role, folder, archive) == false) {
            return
        }

        const url = '/api/tray/getCountOfArchive'

        //console.log(archive+":"+folder+":"+role);

        let response
        try {
            response = await fetch(
                url +
                    '?' +
                    new URLSearchParams({
                        archive: archive,
                        folder: folder,
                        role: role,
                        type: 'invoice',
                    }).toString()
            )
        } catch (err) {
            throw err
        }

        if (response == 'ERR_CONNECTION_REFUSED') {
            console.error('Cannot connect server.')
            alert('Cannot connect server.')
            return
        }

        let res
        try {
            res = await response.json()
        } catch (err) {
            throw err
        }

        let max = res.msg[0]

        try {
            await TrayWidget.SHOWING.setAll(max)
        } catch (e) {
            console.log(' err')
        }

        try {
            await exec(parseInt(count))
        } catch (e) {
            console.log('count err')
        }

        return

        function _argsCheck(role, folderi, archive) {
            switch (role) {
                case 'seller':
                case 'buyer':
                    break
                default:
                    console.error('Error: role:' + role)
                    return false
            }

            switch (folder) {
                case 'paid':
                case 'trash':
                    break
                default:
                    console.error('Error: folder:' + folder)
                    return false
            }

            switch (archive) {
                case 0:
                case '0':
                case 1:
                case '1':
                    break
                default:
                    console.error('Error: archive:' + archive)
                    return false
            }
        }

        return true
    }

    async function api_getFolderTotal() {
        let type = this.API.getActiveFolderType()
        let folder = this.API.getActiveFolderFolder()
        let role = this.API.getActiveFolderRole()
        let archive = this.API.getActiveFolderArchive()

        //console.log("getFolderTotal:"+role +":"+folder+":"+archive);

        if (archive == 1 && folder == 'paid') {
            TrayWidget.API.displayShowingTotal(null)
            return
        }

        if (folder == 'trash') {
            TrayWidget.API.displayShowingTotal(null)
            return
        }

        if (folder == null) {
            return
        }
        if (role == null) {
            return
        }

        const params = {
            type: type,
            role: role,
            folder: folder,
            archive: archive,
        }

        const url = '/api/tray/getTotal'

        let response
        try {
            response = await fetch(
                url +
                    '?' +
                    new URLSearchParams({
                        archive: archive,
                        folder: folder,
                        role: role,
                    }).toString()
            )
        } catch (err) {
            throw err
        }

        if (response == 'ERR_CONNECTION_REFUSED') {
            alert('Cannot connect server.')
            return
        }

        let res
        try {
            res = await response.json()
        } catch (err) {
            throw err
        }

        console.log(res)
        this.API.renderFolderTotal(res)
    }

    function api_renderFolderTotal(msg) {
        let total = msg.total

        // total = total.toLocaleString('en-US', {style:'currency', currency: 'USD'});
        total = total

        TrayWidget.API.displayShowingTotal(total)
    }

    /*
     * When you create a new Document, Simulate clicking on Draft Try.
     */
    function simulate_clickDraftsOfTray() {
        const old_folder = this.MEM.getActiveFolder()
        if (old_folder != null) {
            old_folder.classList.remove('active')
        }

        const new_folder = this.DOM.draft
        this.MEM.setActiveFolder(new_folder)
        new_folder.classList.add('active')

        const role = 'seller'
        const type = 'invoice'
        const folder = 'draft'
        const archive = 0

        TrayWidget.API.openFolderForNewDocument(role, type, folder, archive)
    }

    /*
     * Get folder type.
     */
    function api_getActiveFolderType() {
        const folder = this.MEM.getActiveFolder()
        if (folder == null) {
            return null
        }

        return folder.getAttribute('data-type')
    }

    function api_getActiveFolderFolder() {
        const folder = this.MEM.getActiveFolder()
        if (folder == null) {
            return null
        }

        return folder.getAttribute('data-folder')
    }

    function api_getActiveFolderArchive() {
        const folder = this.MEM.getActiveFolder()
        if (folder == null) {
            return null
        }

        return folder.getAttribute('data-archive')
    }

    function api_getActiveFolderRole() {
        const folder = this.MEM.getActiveFolder()
        if (folder == null) {
            return null
        }

        return folder.getAttribute('data-role')
    }

    async function evt_handleGroupClick(evt) {
        Traceability.API.init()
        DocumentWidget.API.clearDocument()

        TrayWidget.API.nonselectTray()

        await this.API.getCount('handleGroupClick')

        let elem = evt.target
        while (elem.parentNode && elem.tagName !== 'LI') {
            if (elem.tagName === 'UL') {
                return
            }
            elem = elem.parentNode
        }

        const role = elem.getAttribute('data-role')
        const type = elem.getAttribute('data-type')
        const folder = elem.getAttribute('data-folder')
        const archive = elem.getAttribute('data-archive')

        if (!role || !folder || !type) {
            console.log(
                '1 handleGroupClick : folder=' +
                    folder +
                    ':role=' +
                    role +
                    ':type=' +
                    type
            )
            return
        }

        let start = 1

        TrayWidget.DOM.showing.setStart(TrayWidget.SHOWING.setStart(start))

        const ACTIVE = 'active'

        if (this.MEM.getActiveFolder()) {
            this.MEM.getActiveFolder().classList.remove(ACTIVE)
        }

        elem.classList.add(ACTIVE)
        this.MEM.setActiveFolder(elem)

        TrayWidget.API.openFolder(role, type, folder, archive)

        DocumentWidget.API.setTo_from(role)

        if (folder !== 'draft') {
            DocumentWidget.API.readOnly()
        }
    }

    async function api_getCount(from) {
        //console.log("caller "+from);

        await this.API.getCFolderCount()
        await this.API.getDFolderCount()
        await this.API.getDraftsFolderCount()

        DocumentWidget.API.readOnly()
        /*
         * add 20220407 k.ogawa
         * Totalの表示
         */
        setTimeout(
            function () {
                this.API.getFolderTotal()
            }.bind(this),
            500
        )
    }

    function api_openTab(leaf) {
        this.DOM.toggle[this.MEM.leaf].classList.remove('active')
        this.DOM.display[this.MEM.leaf].classList.remove('open')

        //this.MEM.leaf = leaf;
        this.MEM.setLeaf(leaf)

        this.DOM.toggle[this.MEM.leaf].classList.add('active')
        this.DOM.display[this.MEM.leaf].classList.add('open')

        this.API.getCount('openTab')
    }

    function evt_handleToggleClick(evt) {
        let elem = evt.target
        if (elem.tagName !== 'TD') {
            return
        }

        let id = elem.getAttribute('id')
        if (!id) {
            return
        }

        const parts = id.split('.')
        const leaf = parts.pop()
        this.API.openTab(leaf)
    }

    /*
     * plus 文字で、新規のDocumentをDraftsに追加する
     */
    function evt_handleInvoiceCreate(evt) {
        Traceability.API.init()

        TrayWidget.SHOWING.setAll(parseInt(this.DOM.c.draft.innerText))
        TrayWidget.DOM.showing.setAll(TrayWidget.SHOWING.addAll())

        const role = 'seller'
        DocumentWidget.API.setTo_from(role)

        this.DOM.create.nondisplay()
        if (
            ContactWidget.API.checkSaveTimeout() &&
            DocumentWidget.API.checkSaveTimeout()
        ) {
            this.SERVER.invoiceCreate()
        } else {
            let timeout = setTimeout(() => {
                this.SERVER.invoiceCreate()
            }, this.MEM.getTimeout())

            this.MEM.setSaveTimeout(timeout)
        }
    }

    async function server_invoiceCreate() {
        const params = {}

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        }

        const url = '/api/invoice/create'

        let response
        try {
            response = await fetch(url, opts)
        } catch (err) {
            throw err
        }

        if (response == 'ERR_CONNECTION_REFUSED') {
            alert('Cannot connect server.')
            return
        }

        await this.API.updateInvoiceDraftCount()
    }

    function api_init() {
        let session = SessionWidget.API.getSessionMemory()

        // We should probably look at the member type and make decisions based off that

        this.API.getCount('init')
    }
}.apply({})
