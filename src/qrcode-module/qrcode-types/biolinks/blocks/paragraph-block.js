import { mdiText } from '@mdi/js'

import { html, css } from 'lit'

import { t } from '../../../../core/translate'

import { BaseBlock } from './base-block'
import { BlockRenderHelper } from './render-helper'

export class ParagraphBlock extends BaseBlock {
    static styles = [
        ...super.styles,
        css`
            :host {
                display: block;
            }
        `,
    ]

    static name() {
        return t`Paragraph`
    }

    static slug() {
        return 'paragraph'
    }

    static icon() {
        return mdiText
    }

    modelName() {
        let text = this.model.getData()?.text

        text = text?.substring(0, 20)

        return text
    }

    renderEditForm() {
        return html`
            <qrcg-textarea name="text" placeholder="${t`Text`}">
                ${t`Text`}
            </qrcg-textarea>

            <qrcg-color-picker name="textColor">
                ${t`Text Color`}
            </qrcg-color-picker>

            <qrcg-color-picker name="background_color">
                ${t`Background Color`}
            </qrcg-color-picker>

            ${BlockRenderHelper.renderBlockPaddingInput()}
            <!--  -->
            ${BlockRenderHelper.renderBorderRadiusInput()}
            <!--  -->
            ${BlockRenderHelper.renderFontInputs()}
        `
    }
}

window.defineCustomElement(ParagraphBlock.tag, ParagraphBlock)
