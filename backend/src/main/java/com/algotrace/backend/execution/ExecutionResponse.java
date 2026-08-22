package com.algotrace.backend.execution;

import com.algotrace.engine.model.ExecutionTrace;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ExecutionResponse {

    private final boolean success;

    private final ExecutionTrace trace;

    private final String error;

    public static ExecutionResponse success(
            ExecutionTrace trace
    ) {

        return new ExecutionResponse(
                true,
                trace,
                null
        );
    }

    public static ExecutionResponse failure(
            String error
    ) {

        return new ExecutionResponse(
                false,
                null,
                error
        );
    }
}