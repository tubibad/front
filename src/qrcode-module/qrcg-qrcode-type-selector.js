import { html } from 'lit'

import { observeState } from 'lit-element-state'

import { classMap } from 'lit/directives/class-map.js'

import { t } from '../core/translate'

import { state } from './state'

import { escapeRegExp, isEmpty, queryParam, random } from '../core/helpers'

import { QRCGRouteParamsController } from '../core/qrcg-route-params-controller'

import { getAvailableQrCodeTypes, QRCodeTypeManager } from '../models/qr-types'

import {
    currentPlan,
    currentPlanHasQrCodeType,
} from '../core/subscription/logic'

import { BillingMode } from '../subscription-plan-module/billing-mode'

import { price } from '../models/currency'

import { AccountCreditManager } from '../subscription-plan-module/account-credit-manager'

import { PlanEnforcement } from '../core/subscription/plan-enforcement'
import { Config } from '../core/qrcg-config'
import { DemoLicenseExplainer } from './demo-license-explainer/demo-license-explainer'
import { BaseComponent } from '../core/base-component/base-component'

import style from './qrcg-qrcode-type-selector.scss?inline'

export class QRCGQRCodeTypeSelector extends observeState(BaseComponent) {
    static get tag() {
        return 'qrcg-qrcode-type-selector'
    }

    static EVENT_TYPE_SELECTED = 'qrcode-type-selected'

    routeParams = new QRCGRouteParamsController(this)

    billing = new BillingMode()

    qrcodeTypeManager = new QRCodeTypeManager()

    accountCredit = new AccountCreditManager()

    static styleSheets = [...super.styleSheets, style]

    static get properties() {
        return {
            types: { type: Array },
            value: { type: String },
        }
    }

    constructor() {
        super()

        this.types = getAvailableQrCodeTypes()

        this.filterTypes()
    }

    connectedCallback() {
        super.connectedCallback()

        window.scrollTo({ top: 0, behavior: 'auto' })

        this.bindQueryParamIfNeeded()
    }

    bindQueryParamIfNeeded() {
        const type = queryParam('type')

        if (!this.qrcodeTypeManager.find(type)) return

        if (this.isTypeDisabled(type)) {
            return
        }

        this.setSelectedType(type)
    }

    _typeClick(e) {
        const type = e.currentTarget.getAttribute('type').toLowerCase()

        this.setSelectedType(type)
    }

    setSelectedType(value) {
        this.value = value

        this.dispatchEvent(
            new CustomEvent(QRCGQRCodeTypeSelector.EVENT_TYPE_SELECTED, {
                bubbles: true,
                composed: true,
                detail: {
                    type: value,
                },
            })
        )
    }

    onSelectedCategoryChanged(e) {
        e.stopImmediatePropagation()

        e.preventDefault()

        this.selectedCategory = e.detail.value

        this.queueFilter()
    }

    onKeywordChanged(e) {
        e.stopImmediatePropagation()

        e.preventDefault()

        this.keyword = e.detail.value

        this.queueFilter()
    }

    queueFilter() {
        //
        clearTimeout(this.__filterTypesTimeout)

        this.__filterTypesTimeout = setTimeout(() => this.filterTypes(), 500)
    }

    planConfigurationAllowsShowing(type) {
        const behaviour = currentPlan()?.unavailable_types_behaviour

        if (behaviour !== 'hidden') {
            return true
        }

        return currentPlanHasQrCodeType(type.id)
    }

    filterTypes() {
        this.filteredTypes = this.types.filter((type) => {
            return (
                this.typeMatchesKeyword(type) &&
                this.typeMatchesSelectedCategory(type) &&
                this.planConfigurationAllowsShowing(type)
            )
        })

        this.requestUpdate()
    }

    typeMatchesKeyword(type) {
        try {
            const pattern = escapeRegExp(this.keyword)
            return JSON.stringify(type).match(new RegExp(pattern, 'i'))
        } catch {
            return true
        }
    }

    typeMatchesSelectedCategory(type) {
        if (isEmpty(this.selectedCategory)) {
            this.selectedCategory = 'all'
        }

        if (this.selectedCategory === 'all') return true

        return type.cat === this.selectedCategory
    }

    typeKeyPress(e) {
        if (e.key === 'Enter') {
            this._typeClick(e)
        }
    }

    isLoading() {
        return (
            isEmpty(state.remoteRecord) &&
            this.routeParams.get('id') != null &&
            !isNaN(this.routeParams.get('id'))
        )
    }

    getPrice(id) {
        return price(this.accountCredit.getQRCodeTypePrice(id))
    }

    renderAccountCreditPrice(type) {
        if (this.billing.isSubscription()) return

        return html` <div class="price">${this.getPrice(type.id)}</div> `
    }

    getRouteId() {
        const lastPartOfCurrentRoute = window.location.pathname
            .split('/')
            .splice(-1)[0]

        if (isNaN(lastPartOfCurrentRoute)) return null

        return lastPartOfCurrentRoute
    }

    isCreatingNewQRCode() {
        return isEmpty(this.getRouteId())
    }

    isTypeDisabled(id) {
        if (this.billing.isAccountCredit()) {
            if (state.id) return id != state.type

            return false
        }

        const disabled = !currentPlanHasQrCodeType(id)

        if (disabled) {
            return true
        }

        return (
            this.qrcodeTypeManager.isDynamic(id) &&
            PlanEnforcement.dynamicQRCodeLimitsReached() &&
            this.isCreatingNewQRCode()
        )
    }

    generatePlaceholder() {
        if (isEmpty(this.types)) return t`Search ...`

        const randomType = this.types[random(0, this.types.length - 1)]

        return `${t('Try')} ${t(randomType.name)}`
    }

    renderIcon(type) {
        const svgIcon = type.svgIcon

        const icon = type.icon

        if (svgIcon) {
            return html` <qrcg-icon .icon=${svgIcon}></qrcg-icon> `
        }

        return html` <qrcg-icon .mdiIcon=${icon}></qrcg-icon> `
    }

    renderUpgradeMessageIfNeeded(type) {
        if (currentPlanHasQrCodeType(type.id)) return

        return html`
            <div class="disabled-type-message">
                ${t`Upgrade to use this type.`}
            </div>
        `
    }

    renderType(type) {
        return html`
            <div
                tabindex="0"
                class="${classMap({
                    type: true,
                    selected: type.id === this.value,
                })}"
                @click=${this._typeClick}
                @keypress=${this.typeKeyPress}
                type=${type.id}
                ?loading=${this.isLoading()}
                ?disabled=${this.isTypeDisabled(type.id)}
            >
                <div class="details-container">
                    <div class="icon">${this.renderIcon(type)}</div>
                    <div class="details">
                        <div class="name">${t(type.name)}</div>
                        <div class="cat">${t(type.cat)}</div>
                    </div>
                </div>

                ${this.renderAccountCreditPrice(type)}
                ${this.renderUpgradeMessageIfNeeded(type)}
            </div>
        `
    }

    renderNumberOfTypes() {
        if (this.filteredTypes.length == this.types.length) {
            return `${t('Showing')} ${this.types.length} ${t('types')}.`
        }

        return t`${t('Showing')} ${this.filteredTypes.length} ${t('out of')} ${
            this.types.length
        } ${t('types')}.`
    }

    isSearchboxDisabled() {
        const value = Config.get('qrcode.searchbox_in_qrcode_selection_page')

        return value === 'disabled'
    }

    renderSearchBox() {
        if (this.isSearchboxDisabled()) return

        return html`
            <div class="searchbox-container">
                <div class="searchbox">
                    <qrcg-input
                        name="keyword"
                        placeholder="${this.generatePlaceholder()}"
                        @on-input=${this.onKeywordChanged}
                        autofocus
                    >
                        ${t`Search`}
                    </qrcg-input>

                    <qrcg-balloon-selector
                        @on-input=${this.onSelectedCategoryChanged}
                        .options=${[
                            {
                                name: t`All`,
                                value: 'all',
                            },
                            {
                                name: t`Static`,
                                value: 'static',
                            },
                            {
                                name: t`Dynamic`,
                                value: 'dynamic',
                            },
                        ]}
                    >
                        ${t`Type`}
                    </qrcg-balloon-selector>
                </div>

                <div class="number-of-types">${this.renderNumberOfTypes()}</div>
            </div>
        `
    }

    render() {
        return html`
            ${DemoLicenseExplainer.renderSelf()}
            <!--  -->

            ${this.renderSearchBox()}

            <div class="types">
                ${this.filteredTypes.map((type) => this.renderType(type))}
            </div>
        `
    }
}

QRCGQRCodeTypeSelector.register()
