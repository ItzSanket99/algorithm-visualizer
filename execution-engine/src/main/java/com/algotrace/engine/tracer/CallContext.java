package com.algotrace.engine.tracer;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class CallContext {

    /**
     * Unique invocation id.
     */
    private final long callId;

    /**
     * Parent invocation.
     */
    private final Long parentCallId;

    /**
     * Method name.
     */
    private final String methodName;

    /**
     * Recursion depth.
     */
    private final int depth;

    /**
     * Method parameters.
     */
    private final Map<String, String> parameters;

}