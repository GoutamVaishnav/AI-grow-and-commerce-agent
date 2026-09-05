from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf" / "shopagent-ai-5-minute-demo-plan.pdf"

NAVY = colors.HexColor("#1E1B4B")
VIOLET = colors.HexColor("#7C3AED")
LAVENDER = colors.HexColor("#F5F3FF")
GOLD = colors.HexColor("#FBBF24")
TEAL = colors.HexColor("#0F766E")
SLATE = colors.HexColor("#334155")
MUTED = colors.HexColor("#64748B")
LINE = colors.HexColor("#E2E8F0")
SOFT_GREEN = colors.HexColor("#ECFDF5")
SOFT_AMBER = colors.HexColor("#FFFBEB")
SOFT_RED = colors.HexColor("#FEF2F2")


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="Kicker", parent=styles["Normal"], fontName="Helvetica-Bold",
        fontSize=8, leading=10, textColor=VIOLET, spaceAfter=4,
        tracking=0.5,
    ))
    styles.add(ParagraphStyle(
        name="TitleCustom", parent=styles["Title"], fontName="Helvetica-Bold",
        fontSize=26, leading=31, textColor=NAVY, spaceAfter=7,
    ))
    styles.add(ParagraphStyle(
        name="Subtitle", parent=styles["Normal"], fontName="Helvetica",
        fontSize=11, leading=16, textColor=SLATE, spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="H1Custom", parent=styles["Heading1"], fontName="Helvetica-Bold",
        fontSize=16, leading=20, textColor=NAVY, spaceBefore=2, spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="H2Custom", parent=styles["Heading2"], fontName="Helvetica-Bold",
        fontSize=11, leading=14, textColor=NAVY, spaceBefore=6, spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="BodyCustom", parent=styles["BodyText"], fontName="Helvetica",
        fontSize=9.2, leading=13.2, textColor=SLATE, spaceAfter=5,
    ))
    styles.add(ParagraphStyle(
        name="Small", parent=styles["BodyText"], fontName="Helvetica",
        fontSize=8, leading=10.5, textColor=SLATE,
    ))
    styles.add(ParagraphStyle(
        name="SmallBold", parent=styles["BodyText"], fontName="Helvetica-Bold",
        fontSize=8, leading=10.5, textColor=NAVY,
    ))
    styles.add(ParagraphStyle(
        name="Table", parent=styles["BodyText"], fontName="Helvetica",
        fontSize=7.7, leading=9.6, textColor=SLATE,
    ))
    styles.add(ParagraphStyle(
        name="TableBold", parent=styles["BodyText"], fontName="Helvetica-Bold",
        fontSize=7.7, leading=9.6, textColor=NAVY,
    ))
    styles.add(ParagraphStyle(
        name="Quote", parent=styles["BodyText"], fontName="Helvetica-Oblique",
        fontSize=10, leading=14, textColor=NAVY,
    ))
    return styles


S = build_styles()


def p(text, style="BodyCustom"):
    return Paragraph(text, S[style])


def bullet(text):
    return Paragraph(f'<font color="#7C3AED">&#8226;</font>&nbsp;&nbsp;{text}', S["BodyCustom"])


def panel(title, body, fill=LAVENDER, accent=VIOLET):
    content = [p(title, "H2Custom"), p(body, "BodyCustom")]
    table = Table([[content]], colWidths=[174 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), fill),
        ("BOX", (0, 0), (-1, -1), 0.75, accent),
        ("LINEBEFORE", (0, 0), (0, 0), 4, accent),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def timeline_table(rows):
    header = [
        p('<font color="#FFFFFF">TIME</font>', "TableBold"),
        p('<font color="#FFFFFF">SCREEN / ACTION</font>', "TableBold"),
        p('<font color="#FFFFFF">NARRATION</font>', "TableBold"),
    ]
    data = [header]
    for time, action, narration in rows:
        data.append([p(time, "TableBold"), p(action, "Table"), p(narration, "Table")])
    table = Table(data, colWidths=[25 * mm, 58 * mm, 91 * mm], repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFAFC")]),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def footer(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(NAVY)
    canvas.rect(0, height - 10 * mm, width, 10 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.drawString(18 * mm, height - 6.6 * mm, "SHOPAGENT AI  |  RAZORPAY AI GROWTH & AGENTIC COMMERCE BUILATHON")
    canvas.setStrokeColor(LINE)
    canvas.line(18 * mm, 12 * mm, width - 18 * mm, 12 * mm)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 7 * mm, "Product demo recording plan - based on the current implementation")
    canvas.drawRightString(width - 18 * mm, 7 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT), pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm, topMargin=17 * mm, bottomMargin=18 * mm,
        title="ShopAgent AI - 5-Minute Demo Plan",
        author="ShopAgent AI",
    )
    story = []

    # Page 1 - verified demo setup.
    story += [
        Spacer(1, 7 * mm),
        p("SCREEN-RECORDED PRODUCT DEMO", "Kicker"),
        p("ShopAgent AI", "TitleCustom"),
        p("A professional 5-minute demo plan for the Razorpay AI Growth & Agentic Commerce Builathon.", "Subtitle"),
        panel(
            "Core story",
            "A customer describes a need in plain language. ShopAgent AI searches real catalog data, recommends a product, performs controlled cart actions, and makes AI-attributed revenue visible to the merchant. Payment remains an explicit customer decision.",
            LAVENDER, VIOLET,
        ),
        Spacer(1, 5 * mm),
        p("Verified demo scenario", "H1Custom"),
        p("Use this scenario because it is reliable in the current DummyJSON-derived catalog and demonstrates the organic-versus-AI revenue split.", "BodyCustom"),
    ]
    scenario_data = [
        [p("Primary product", "SmallBold"), p("American Football", "SmallBold"), p("INR 1,699 | Rating 4.91 | In stock", "Small")],
        [p("AI-related item", "SmallBold"), p("Baseball Ball", "SmallBold"), p("INR 764 | In stock", "Small")],
        [p("Cart result", "SmallBold"), p("Organic INR 1,699 + AI INR 764", "SmallBold"), p("Final value: INR 2,463", "Small")],
    ]
    scenario = Table(scenario_data, colWidths=[40 * mm, 65 * mm, 69 * mm])
    scenario.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SOFT_GREEN),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#A7F3D0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story += [scenario, Spacer(1, 5 * mm), p("Before recording", "H1Custom")]
    prep = [
        [p("1", "SmallBold"), p("Log in with the merchant account: <b>goutamvaishnav468@gmail.com</b>. Checkout requires login, and this account can open Merchant pages.", "Small")],
        [p("2", "SmallBold"), p("Empty the browser cart manually before the dry run. Keep old merchant analytics data intact; do not promise an aggregate dashboard total that may include previous test orders.", "Small")],
        [p("3", "SmallBold"), p("Start on the home page at 100% browser zoom. Run the complete flow once without recording to confirm the card order and payment fallback state.", "Small")],
        [p("4", "SmallBold"), p("Add American Football from its normal product page, not the AI quick-add button. This keeps INR 1,699 as organic revenue.", "Small")],
    ]
    prep_table = Table(prep, colWidths=[10 * mm, 164 * mm])
    prep_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story += [prep_table, Spacer(1, 5 * mm), panel(
        "Exact prompts to use",
        "1. <b>I need a sports accessory under INR 2000.</b><br/>2. <b>Show me American Football.</b><br/>3. <b>Suggest something related to this.</b><br/>4. <b>Yes</b>",
        SOFT_AMBER, GOLD,
    ), PageBreak()]

    # Page 2 - first half of timeline.
    story += [Spacer(1, 7 * mm), p("Exact 5-minute timeline", "TitleCustom"), p("Part 1 - discovery, recommendation, cart action and AI attribution", "Subtitle")]
    timeline_one = [
        ("0:00-0:25", "Home page. Show the normal storefront, product browsing UI, and the AI Shopping navigation link.", "Traditional ecommerce makes people browse and compare manually. ShopAgent AI lets the customer explain what they need, then turns that request into catalog-backed shopping actions."),
        ("0:25-0:55", "Open AI Shopping. Enter: <b>I need a sports accessory under INR 2000.</b> Pause while the response arrives.", "The agent understands the request and selects a bounded product-search action. Products, price, rating, and stock come from the application catalog; the AI does not invent them."),
        ("0:55-1:20", "Show the American Football recommendation: INR 1,699, rating 4.91, in stock. Click its image or title to open the product page. Do not use the AI quick-add button here.", "This is a suitable in-stock match in the live catalog. The recommendation is based on deterministic catalog results, not a made-up answer from the model."),
        ("1:20-1:40", "On the product page, click the normal yellow <b>Add to Cart</b> button for American Football. Return to AI Shopping.", "The customer adds the primary product directly. This gives us a clean organic base cart value of INR 1,699."),
        ("1:40-2:00", "In AI Shopping, enter: <b>Show me American Football.</b>", "Now the agent has a real catalog product in context. This is important because the next request will use structured related-product data instead of free-form chat text."),
        ("2:00-2:20", "Enter: <b>Suggest something related to this.</b> Show related product cards.", "The agent fetches related in-stock catalog products. This is the agentic commerce part: it is not only answering; it is taking a controlled commerce action through tools."),
        ("2:20-2:35", "Enter: <b>Yes</b>. Show Baseball Ball added to the cart for INR 764.", "After explicit customer acceptance, the agent adds the first related item. The new INR 764 quantity is attributed to AI assistance."),
    ]
    story += [timeline_table(timeline_one), Spacer(1, 5 * mm), panel(
        "Important recording rule",
        "For this revenue split, do not click <b>Accept AI pick</b> for the first product. That button correctly tags the primary product as AI-assisted. Use the normal product-page Add to Cart button first, then let the agent add Baseball Ball after the customer says Yes.",
        SOFT_AMBER, GOLD,
    ), PageBreak()]

    # Page 3 - second half of timeline.
    story += [Spacer(1, 7 * mm), p("Exact 5-minute timeline", "TitleCustom"), p("Part 2 - checkout, payment safety, merchant proof and closing", "Subtitle")]
    timeline_two = [
        ("2:35-2:55", "Open Cart. Highlight <b>Original Cart Value: INR 1,699</b>, <b>AI Added Revenue: INR 764</b>, and <b>Final Value: INR 2,463</b>.", "This is explainable incremental revenue. The first item was customer-added; the extra INR 764 came from the AI-driven related-product action."),
        ("2:55-3:15", "Proceed to Checkout. Expand <b>Demo fallback settings</b>, choose Failure, and click Continue to Payment.", "Payment cannot be triggered by the agent. The customer must explicitly approve it. This current demo uses a simulated payment fallback when Razorpay Test Mode credentials are not configured."),
        ("3:15-3:35", "Show Payment Failed and the cart-safe message. Close the modal, switch to Success, then pay again and show the confirmation.", "On failure, no charge is made and the cart remains safe for retry. After the customer retries with success, the order is confirmed."),
        ("3:35-4:05", "Open Merchant Dashboard, then Merchant Orders. Focus on the newest confirmed order and the AI Generated Revenue card.", "The merchant can see more than total sales. Confirmed orders preserve organic versus AI-generated revenue, plus AI upsells, average order value, and conversion metrics."),
        ("4:05-4:30", "Open Merchant - AI Activity. Show the search, related-product, add-to-cart, and checkout activity entries.", "The audit trail records what the user asked, which bounded action the agent took, why it took it, the result, and the attributed revenue impact."),
        ("4:30-5:00", "Open Merchant - AI-Readable Catalog. Show the readiness score and structured catalog response. End on this clean screen.", "ShopAgent AI is not only a human storefront. Its structured catalog and controlled APIs make the merchant understandable and transactable by AI buyers too."),
    ]
    story += [timeline_table(timeline_two), Spacer(1, 5 * mm), panel(
        "Payment wording to use",
        "Say <b>simulated payment demo</b> for this recording. The code supports Razorpay Test Mode order creation, Checkout, signature verification, and webhooks only when the required Razorpay credentials are configured. Do not call the recorded fallback flow a live payment.",
        SOFT_RED, colors.HexColor("#DC2626"),
    ), PageBreak()]

    # Page 4 - tabs, visual highlights, risks, closing.
    story += [Spacer(1, 7 * mm), p("Recording guide", "TitleCustom"), p("Keep the demo visual, controlled, and fully aligned to what the product actually implements.", "Subtitle")]
    story += [p("Keep these browser tabs ready", "H1Custom")]
    tabs = [
        [p("Home", "SmallBold"), p("/", "Small")],
        [p("AI Shopping", "SmallBold"), p("/ai-shopping", "Small")],
        [p("Product", "SmallBold"), p("/products?q=American%20Football", "Small")],
        [p("Cart and Checkout", "SmallBold"), p("/cart  |  /checkout", "Small")],
        [p("Merchant proof", "SmallBold"), p("/merchant  |  /merchant/orders  |  /merchant/ai-activity  |  /merchant/catalog", "Small")],
    ]
    tabs_table = Table(tabs, colWidths=[45 * mm, 129 * mm])
    tabs_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LAVENDER),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story += [tabs_table, Spacer(1, 5 * mm), p("Highlight these elements", "H1Custom")]
    highlights = [
        "AI recommendation panel; product price, rating, and stock; the normal Add to Cart button.",
        "Cart split: Original Cart Value, AI Added Revenue, and Final Value.",
        "Demo fallback settings; Payment Failed; the cart-safe message; Payment Successful.",
        "Merchant revenue cards, latest confirmed order, AI Activity audit entries, and AI Readiness Score.",
    ]
    story += [bullet(item) for item in highlights]
    story += [Spacer(1, 2 * mm), p("Do not show or claim", "H1Custom")]
    cautions = [
        "Do not claim Nike running shoes at INR 3,999, Running Socks at INR 499, or a final INR 4,498 cart. Those are not the verified current catalog flow.",
        "Do not describe the custom state pipeline as the LangGraph library. Say <b>LangGraph-shaped agent pipeline</b>.",
        "Do not fake a tool-call interface. The UI shows recommendations and results, not raw internal tool-call traces.",
        "Do not call the fallback payment flow live Razorpay payment. Do not narrate an exact aggregate dashboard total when earlier test orders are present.",
    ]
    story += [bullet(item) for item in cautions]
    story += [Spacer(1, 3 * mm), panel(
        "Final 20-second closing pitch",
        "ShopAgent AI converts a conventional storefront into an AI-ready commerce platform. Instead of only chatting, the agent can discover products, recommend related items, manage cart actions, and produce explainable additional revenue. The structured catalog and bounded APIs also make merchants discoverable and transactable by AI buyers, while customer approval remains central to every payment.",
        LAVENDER, VIOLET,
    ), Spacer(1, 5 * mm), p("Final checklist", "H1Custom")]
    check_data = [
        [p("Before", "SmallBold"), p("Restart the app if needed; log in; empty the cart; verify the Grok response once; confirm simulated payment mode; open the tabs above.", "Small")],
        [p("During", "SmallBold"), p("Speak slowly, pause 2-4 seconds on important cards, keep browser zoom at 100%, and move the cursor deliberately.", "Small")],
        [p("After", "SmallBold"), p("Check that the video is close to 5 minutes, no secrets are visible, and every claim matches the displayed product behavior.", "Small")],
    ]
    check_table = Table(check_data, colWidths=[25 * mm, 149 * mm])
    check_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), SOFT_GREEN),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story += [check_table]

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUTPUT)


if __name__ == "__main__":
    build_pdf()
