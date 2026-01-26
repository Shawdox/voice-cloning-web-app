from playwright.sync_api import sync_playwright


def normalize(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000", wait_until="networkidle")

        page.get_by_text("语音生成", exact=True).click()
        page.wait_for_timeout(1000)

        textarea = page.locator("textarea[placeholder*='请输入您想要合成的文本内容']").first
        textarea.wait_for(state="visible")

        textarea.click()
        textarea.fill("(开心)你好")
        page.wait_for_timeout(200)
        result_1 = normalize(textarea.input_value())

        textarea.fill("(happy)   hello")
        page.wait_for_timeout(200)
        result_2 = normalize(textarea.input_value())

        textarea.fill("(开心)\n今天真好")
        page.wait_for_timeout(200)
        result_3 = normalize(textarea.input_value())

        assert result_1 == "(开心) 你好"
        assert result_2 == "(happy) hello"
        assert result_3 == "(开心)\n今天真好"

        browser.close()


if __name__ == "__main__":
    main()
