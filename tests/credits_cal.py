# 给定文本，计算其应该扣除多少积分
# 10,000 credits --> 114,000 bytes
def get_utf8_num(text: str) -> int:
    utf8_bytes = text.encode('utf-8')
    return len(utf8_bytes)

def get_credits(utf8_num: int) -> int:
    # 每10,000 credits对应114,000 bytes
    credits_per_114000_bytes = 10000
    bytes_per_credits = 114000 / credits_per_114000_bytes
    credits = utf8_num / bytes_per_credits
    return int(round(credits))

def calculate_credits_deduction(text: str) -> int:
    utf8_num = get_utf8_num(text)
    credits = get_credits(utf8_num)
    return credits

if __name__ == "__main__":
    with open("./input_txt/input1.txt", "r", encoding="utf-8") as f:
        sample_text = f.read()
    deduction = calculate_credits_deduction(sample_text)
    print(f"Text: {sample_text}")
    print(f"UTF-8 Byte Count: {get_utf8_num(sample_text)}")
    print(f"Credits Deduction: {deduction}")