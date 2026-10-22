from app.services import technical


def test_sma_basic():
    vals = [1, 2, 3, 4, 5]
    result = technical.sma(vals, 3)
    assert result[:2] == [None, None]
    assert result[2] == 2.0
    assert result[-1] == 4.0


def test_rsi_all_gains_is_100():
    vals = [i for i in range(1, 30)]  # strictly increasing
    result = technical.rsi(vals, period=14)
    assert result[14] == 100


def test_bollinger_bands_ordering():
    vals = [10, 11, 9, 12, 8, 13, 7, 14, 6, 15, 5, 16, 4, 17, 3, 18, 2, 19, 1, 20]
    bands = technical.bollinger(vals, period=10)
    for u, m, l in zip(bands["upper"], bands["mid"], bands["lower"]):
        if u is None:
            continue
        assert l <= m <= u
