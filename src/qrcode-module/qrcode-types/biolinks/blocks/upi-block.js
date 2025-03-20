import { mdiContactlessPayment } from '@mdi/js'
import { html, css } from 'lit'
import { t } from '../../../../core/translate'
import { LinkBlock } from './link-block'
import { QrcgUpiQRCodeForm } from '../../upi/form'

export class UpiBlock extends LinkBlock {
    static styles = [
        ...super.styles,
        css`
            :host {
                display: block;
            }
        `,
    ]

    static name() {
        return t`UPI Block`
    }

    static slug() {
        return 'upi'
    }

    static icon() {
        return mdiContactlessPayment
    }

    renderEditForm() {
        return html`
            ${QrcgUpiQRCodeForm.renderFormFields()}
            <!--  -->
            ${super.renderEditForm()}
        `
    }

    renderUrlInput() {}

    renderTargetInput() {}
}

UpiBlock.register()
