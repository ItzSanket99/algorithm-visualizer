package com.algotrace.engine.model;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@Builder
@ToString
public class ExecutionEvent {

    /**
     * Unique event id.
     */
    private final long eventId;

    /**
     * Time when event occurred.
     */
    private final long timestamp;

    /**
     * Event category.
     */
    private final EventType eventType;

    /**
     * Current executing method.
     */
    private final String methodName;

    /**
     * Source code line number.
     */
    private final int lineNumber;

    /**
     * Thread id.
     */
    private final long threadId;

}