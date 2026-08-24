    package com.algotrace.engine.model;

    import lombok.Builder;
    import lombok.Getter;
    import lombok.ToString;

    import java.util.Map;

    @Getter
    @Builder
    @ToString
    public class ExecutionEvent {

        private final long eventId;

        private final long timestamp;

        private final EventType eventType;

        private final String methodName;

        private final int lineNumber;

        private final long threadId;

        private final long callId;

        private final Long parentCallId;

        private final int callDepth;

        private final Map<String, String> parameters;

        private final Map<String, String> variables;

        private final String returnValue;

    }