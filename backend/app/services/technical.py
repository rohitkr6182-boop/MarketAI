"""Technical indicator calculations, shared by the API layer, the AI tools,
and the ML feature pipeline so there's exactly one implementation of each."""
from typing import Optional


def sma(values: list[float], period: int) -> list[Optional[float]]:
    out = []
    for i in range(len(values)):
        if i < period - 1:
            out.append(None)
        else:
            out.append(round(sum(values[i - period + 1:i + 1]) / period, 4))
    return out


def ema(values: list[float], period: int) -> list[Optional[float]]:
    out, k, prev = [], 2 / (period + 1), None
    for v in values:
        prev = v if prev is None else v * k + prev * (1 - k)
        out.append(round(prev, 4))
    return out


def rsi(values: list[float], period: int = 14) -> list[Optional[float]]:
    out = [None] * len(values)
    if len(values) <= period:
        return out
    gains, losses = [], []
    for i in range(1, len(values)):
        diff = values[i] - values[i - 1]
        gains.append(max(diff, 0))
        losses.append(max(-diff, 0))
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    out[period] = 100 - 100 / (1 + (avg_gain / avg_loss if avg_loss else 999))
    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
        rs = avg_gain / avg_loss if avg_loss else 999
        out[i + 1] = round(100 - 100 / (1 + rs), 2)
    return out


def macd(values: list[float]) -> dict:
    ema12, ema26 = ema(values, 12), ema(values, 26)
    macd_line = [round(a - b, 4) if a is not None and b is not None else None for a, b in zip(ema12, ema26)]
    signal = ema([m if m is not None else 0 for m in macd_line], 9)
    hist = [round(m - s, 4) if m is not None and s is not None else None for m, s in zip(macd_line, signal)]
    return {"macd": macd_line, "signal": signal, "histogram": hist}


def bollinger(values: list[float], period: int = 20, mult: float = 2) -> dict:
    mid = sma(values, period)
    upper, lower = [], []
    for i in range(len(values)):
        if mid[i] is None:
            upper.append(None); lower.append(None); continue
        window = values[i - period + 1:i + 1]
        mean = mid[i]
        var = sum((x - mean) ** 2 for x in window) / period
        std = var ** 0.5
        upper.append(round(mean + mult * std, 4))
        lower.append(round(mean - mult * std, 4))
    return {"upper": upper, "mid": mid, "lower": lower}


def atr(highs: list[float], lows: list[float], closes: list[float], period: int = 14) -> list[Optional[float]]:
    trs = []
    for i in range(len(closes)):
        if i == 0:
            trs.append(highs[i] - lows[i]); continue
        trs.append(max(highs[i] - lows[i], abs(highs[i] - closes[i - 1]), abs(lows[i] - closes[i - 1])))
    return sma(trs, period)


def explain_rsi(value: Optional[float]) -> str:
    if value is None:
        return "Not enough data yet."
    if value >= 70:
        return f"RSI is {value}, in overbought territory (>=70) -- momentum has been strongly positive, which sometimes precedes a pullback, but is not a guarantee."
    if value <= 30:
        return f"RSI is {value}, in oversold territory (<=30) -- momentum has been strongly negative, which sometimes precedes a bounce, but is not a guarantee."
    return f"RSI is {value}, a neutral-to-moderate reading -- momentum is neither extreme, on its own this says little about future direction."
