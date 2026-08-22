package com.algotrace.backend.execution;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ExecutionResponse {

    private final boolean success;

    private final ExecutionData execution;

    private final String error;

    public static ExecutionResponse success(
            ExecutionData execution
    ) {

        return new ExecutionResponse(
                true,
                execution,
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