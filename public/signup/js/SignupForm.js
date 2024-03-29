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

const SignupForm = function () {
    this.MEM = {
        visible: false,
        checkCount: 10,
    }

    this.DOM = {
        company: {
            name: document.getElementById('SignupForm.company.name'),
            department: document.getElementById(
                'SignupForm.company.department'
            ),
            tax_id: document.getElementById('SignupForm.company.tax_id'),
        },
        address: {
            country: document.getElementById('SignupForm.address.country'),
            region: document.getElementById('SignupForm.address.region'),
            postcode: document.getElementById('SignupForm.address.postcode'),
            city: document.getElementById('SignupForm.address.city'),
            line1: document.getElementById('SignupForm.address.line1'),
            line2: document.getElementById('SignupForm.address.line2'),
        },
        member: {
            membername: document.getElementById('SignupForm.member.membername'),
            job_title: document.getElementById('SignupForm.member.job_title'),
            contact_email: document.getElementById(
                'SignupForm.member.contact_email'
            ),
            password: document.getElementById('SignupForm.member.password'),
            confirm_password: document.getElementById(
                'SignupForm.member.confirm_password'
            ),
        },
        visible: document.getElementById('SignupForm.visible'),
        submit: document.getElementById('SignupForm.submit'),
    }

    this.EVT = {
        handleFieldFocus: evt_handleFieldFocus.bind(this),
        handleFieldBlur: evt_handleFieldBlur.bind(this),
        handleFieldInput: evt_handleFieldInput.bind(this),
        handleSubmitClick: evt_handleSubmitClick.bind(this),
        handleVisibleClick: evt_handleVisibleClick.bind(this),
    }

    this.API = {
        checkForInput: api_checkForInput.bind(this),
        validateForm: api_validateForm.bind(this),
        getJsonFromUrl: api_getJsonFromUrl.bind(this),
        setCompanyData: api_setCompanyData.bind(this),
        setMemberData: api_setMemberData.bind(this),
        setVisibility: api_setVisibility.bind(this),
    }

    init.apply(this)
    return this

    function init() {
        let inputs = document.getElementsByTagName('input')
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('focus', this.EVT.handleFieldFocus)
            inputs[i].addEventListener('blur', this.EVT.handleFieldBlur)
            inputs[i].addEventListener('input', this.EVT.handleFieldInput)
        }

        this.DOM.visible.addEventListener('click', this.EVT.handleVisibleClick)
        this.DOM.submit.addEventListener('click', this.EVT.handleSubmitClick)
        this.API.setVisibility(false)

        this.API.checkForInput()
        this.DOM.submit.removeAttribute('disabled')
    }

    function evt_handleVisibleClick(evt) {
        evt.preventDefault()
        this.API.setVisibility(!this.MEM.visible)
    }

    function api_setVisibility(bool) {
        this.MEM.visible = bool
        if (!bool) {
            this.DOM.visible.setAttribute('src', 'img/visibility_off.png')
            this.DOM.member.password.setAttribute('type', 'password')
            this.DOM.member.confirm_password.setAttribute('type', 'password')
        } else {
            this.DOM.visible.setAttribute('src', 'img/visibility.png')
            this.DOM.member.password.setAttribute('type', 'text')
            this.DOM.member.confirm_password.setAttribute('type', 'text')
        }
    }

    function api_setMemberData(data) {
        this.API.setVisibility(true)

        this.DOM.member.membername.value = data.member_name
        this.DOM.member.contact_email.value = data.contact_email
        this.DOM.member.job_title.value = data.job_title
        this.DOM.member.password.value = data.password
        this.DOM.member.confirm_password.value = data.password

        this.API.checkForInput()
    }

    function api_setCompanyData(data) {
        this.DOM.company.tax_id.value = data.company_tax_id
        this.DOM.company.name.value = data.company_name
        this.DOM.company.department.value = data.department

        this.DOM.address.country.value = data.country
        this.DOM.address.region.value = data.state
        this.DOM.address.postcode.value = data.postcode
        this.DOM.address.city.value = data.city
        this.DOM.address.line1.value = data.line1
        this.DOM.address.line2.value = data.line2

        this.API.checkForInput()
    }

    function api_checkForInput() {
        console.log('checking for input')

        const inputs = document.getElementsByTagName('input')
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i]
            const field = input.parentNode
            if (field.classList.contains('focus')) {
                return
            }

            const check = input.value.replace(/\s/g, '')

            if (!check.length) {
                input.value = ''
                field.classList.remove('fill')
            } else {
                field.classList.add('fill')
            }
        }

        if (this.MEM.checkCount--) {
            setTimeout(this.API.checkForInput.bind(this), 150)
        }
    }

    function evt_handleFieldFocus(evt) {
        let input = evt.target
        let field = input.parentNode

        field.classList.add('focus')
    }

    function evt_handleFieldBlur(evt) {
        let input = evt.target
        let field = input.parentNode

        let check = input.value.replace(/\s/g, '')

        field.classList.remove('focus')

        if (!check.length) {
            input.value = ''
            field.classList.remove('fill')
        } else {
            field.classList.add('fill')
        }
    }

    function evt_handleFieldInput(evt) {
        this.API.validateForm()
    }

    function evt_handleSubmitClick(evt) {
        let errors = this.API.validateForm()
        if (errors) {
            return
        }

        const args = {
            member: {
                membername: this.DOM.member.membername.value,
                job_title: this.DOM.member.job_title.value,
                contact_email: this.DOM.member.contact_email.value,
                password: this.DOM.member.password.value,
            },
            company: {
                name: this.DOM.company.name.value,
                department: this.DOM.company.department.value,
                tax_id: this.DOM.company.tax_id.value,
            },
            address: {
                country: this.DOM.address.country.value,
                region: this.DOM.address.region.value,
                postcode: this.DOM.address.postcode.value,
                city: this.DOM.address.city.value,
                line1: this.DOM.address.line1.value,
                line2: this.DOM.address.line2.value,
            },
        }

        const ajax = new XMLHttpRequest()
        ajax.open('POST', '/api/organization/')
        ajax.setRequestHeader('Content-Type', 'application/json')
        ajax.responseType = 'json'
        ajax.send(JSON.stringify(args))

        ajax.onload = () => {
            let res = ajax.response

            if (res.err) {
                throw res.msg
            }

            window.location.href = '/app/'
        }
    }

    function api_getJsonFromUrl() {
        let url = location.search
        var query = url.substr(1)
        var result = {}
        query.split('&').forEach(function (part) {
            var item = part.split('=')
            result[item[0]] = decodeURIComponent(item[1])
        })
        return result
    }

    function api_validateForm() {
        let errors = 0

        // Here we need to perform a few simple checks

        if (!errors) {
            this.DOM.submit.removeAttribute('disabled')
        } else {
            this.DOM.submit.setAttribute('disabled', 'disabled')
        }

        return errors
    }
}.apply({})
