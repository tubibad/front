import { mdiMenu } from '@mdi/js'
import { html, css } from 'lit'
import { t } from '../../../../core/translate'

import { QrcgLeadformInput } from '../../../../lead-form/input'
import { LinkBlock } from './link-block'
import { currentPlanHasQrCodeType } from '../../../../core/subscription/logic'

export class LeadFormBlock extends LinkBlock {
    static styles = [
        ...super.styles,
        css`
            :host {
                display: block;
            }
        `,
    ]

    static get properties() {
        return {
            ...super.properties,
            buttonText: {},
        }
    }

    static name() {
        return t`Lead Form`
    }

    static slug() {
        return 'lead-form'
    }

    static icon() {
        return mdiMenu
    }

    constructor() {
        super()

        this.buttonText = ''
    }

    modelName() {
        return this.model.field('text', t`Lead Form`)
    }

    renderLegacyLeadFormInput() {
        return html`
            <qrcg-lead-form-input
                name="lead_form_id"
                related_model="QRCode"
                related_model_id="${this.qrcodeId}"
                mode=${QrcgLeadformInput.MODE_EXPANDED}
            ></qrcg-lead-form-input>
        `
    }

    renderUrlInput() {}

    renderFormFields() {
        if (!currentPlanHasQrCodeType('lead-form')) {
            return
        }

        return super.renderEditForm()
    }

    renderTargetInput() {}

    renderEditForm() {
        return html`
            <qrcg-lead-form-selector name="lead_form_id">
            </qrcg-lead-form-selector>

            ${this.renderFormFields()}
        `
    }
}

window.defineCustomElement(LeadFormBlock.tag, LeadFormBlock)
