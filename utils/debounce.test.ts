import { debounce } from "./debounce";

describe("debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("delays calling the function until after the wait period", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 500);

    debounced("a");
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");
  });

  it("cancel prevents a pending call", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 500);

    debounced("a");
    debounced.cancel();

    jest.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
  });

  it("flush fires a pending call immediately", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 500);

    debounced("a");
    debounced.flush();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");

    jest.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
