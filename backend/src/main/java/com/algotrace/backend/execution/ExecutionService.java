package com.algotrace.backend.execution;

import com.algotrace.engine.ExecutionEngine;
import com.algotrace.engine.model.ExecutionTrace;
import org.springframework.stereotype.Service;

@Service
public class ExecutionService {

    private final ExecutionEngine executionEngine;

    public ExecutionService() {

        this.executionEngine =
                new ExecutionEngine();
    }

    public ExecutionResponse execute(
            String sourceCode
    ) {

        if (sourceCode == null ||
                sourceCode.isBlank()) {

            return ExecutionResponse.failure(
                    "Source code cannot be empty."
            );
        }

        try {

            ExecutionTrace trace =
                    executionEngine.execute(
                            sourceCode
                    );

            return ExecutionResponse.success(
                    trace
            );

        } catch (Exception e) {

            return ExecutionResponse.failure(
                    e.getMessage()
            );
        }
    }
}