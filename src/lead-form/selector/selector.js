import { html } from 'lit'
import style from './selector.scss?inline'
import { BaseComponent } from '../../core/base-component/base-component'
import { get } from '../../core/api'
import { isEmpty, isNotEmpty } from '../../core/helpers'
import { t } from '../../core/translate'
import { classMap } from 'lit/directives/class-map.js'
import { mdiRefresh } from '@mdi/js'
import { QRCodeTypeManager } from '../../models/qr-types'
import { currentPlanHasQrCodeType } from '../../core/subscription/logic'
import { ConfigHelper } from '../../core/config-helper'

export class LeadFormSelector extends BaseComponent {
    static tag = 'qrcg-lead-form-selector'

    static styleSheets = [...super.styleSheets, style]

    qrcodes = new QRCodeTypeManager()

    static get properties() {
        return {
            leadForms: {
                type: Array,
            },
            loading: {
                type: Boolean,
            },
            name: {},
            value: {},
        }
    }

    connectedCallback() {
        super.connectedCallback()
        this.fetchData()
    }

    disconnectedCallback() {
        super.disconnectedCallback()
    }

    async fetchData() {
        this.loading = true

        const { json } = await get(
            'lead-forms?with-empty-responses=true&no-pagination=true'
        )

        this.leadForms = json

        this.requestUpdate()

        this.loading = false
    }

    renderLoaderContainer() {
        if (!this.loading) return

        return html`
            <div class="loader-container">
                <qrcg-loader></qrcg-loader>
            </div>
        `
    }

    renderCreateLink(text = t`Create lead form`) {
        return html` <a
            href="/dashboard/qrcodes/new?type=lead-form"
            target="_blank"
            class="create-lead-form-link"
        >
            ${text}
        </a>`
    }

    renderEmptyMessage() {
        if (this.loading) return

        if (isNotEmpty(this.leadForms)) {
            return
        }

        return html`
            <div class="empty-message">
                ${t`No lead forms could be found.`} ${this.renderCreateLink()}

                <qrcg-button class="elegant" @click=${this.fetchData}>
                    <qrcg-icon mdi-icon=${mdiRefresh}></qrcg-icon>
                    ${t`Refresh`}
                </qrcg-button>
            </div>
        `
    }

    getSelectOptions() {
        if (isEmpty(this.leadForms)) {
            return []
        }

        return this.leadForms.map((form) => {
            return {
                name: form.qrcode_name,
                id: form.id,
            }
        })
    }

    getSelectedQRCodeId() {
        const formId = this.$('qrcg-searchable-select')?.value

        if (!formId) {
            return
        }

        return this.leadForms.find((l) => l.id == formId)?.qrcode_id
    }

    renderLeadFormSelector() {
        return html`
            <div
                class="${classMap({
                    hidden: isEmpty(this.leadForms),
                    'select-container': true,
                })}"
            >
                <div class="select-inner-container">
                    <qrcg-searchable-select
                        .items=${this.getSelectOptions()}
                        .value=${this.value}
                        name=${this.name}
                    >
                        <div slot="label">${t`Select Lead Form`}</div>
                    </qrcg-searchable-select>

                    <qrcg-button @click=${this.fetchData} class="elegant">
                        <qrcg-icon mdi-icon=${mdiRefresh}> </qrcg-icon>
                    </qrcg-button>
                </div>

                <div class="links">
                    <a
                        href="/dashboard/qrcodes/edit/${this.getSelectedQRCodeId()}"
                        target="_blank"
                    >
                        ${t`Edit lead form`}
                    </a>

                    ${t`or`} ${this.renderCreateLink(t`create new`)}
                </div>
            </div>
        `
    }

    renderUpgradeMessage() {
        return html`
            <div class="upgrade-message">
                ${t`Lead form type is not available, upgrade now to start creating lead forms.`}
                <qrcg-button
                    href="${ConfigHelper.pricingPlansUrl()}"
                    target="_blank"
                >
                    ${t`Upgrade Now`}
                </qrcg-button>
            </div>
        `
    }

    render() {
        if (!currentPlanHasQrCodeType('lead-form')) {
            return this.renderUpgradeMessage()
        }

        return [
            this.renderLoaderContainer(),
            this.renderEmptyMessage(),
            this.renderLeadFormSelector(),
        ]
    }
}

LeadFormSelector.register()
