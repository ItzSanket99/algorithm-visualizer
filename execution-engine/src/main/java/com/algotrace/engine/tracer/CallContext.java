package com.algotrace.engine.tracer;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CallContext {

    /**
     * Unique function invocation id.
     */
    private final long callId;

    /**
     * Parent invocation.
     *
     * null for root.
     */
    private final Long parentCallId;

    /**
     * Current method.
     */
    private final String methodName;

    /**
     * Current recursion depth.
     */
    private final int depth;

}