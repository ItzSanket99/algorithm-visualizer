package com.algotrace.backend.execution;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/execution")
public class ExecutionController {

    private final ExecutionService executionService;

    public ExecutionController(
            ExecutionService executionService
    ) {

        this.executionService =
                executionService;
    }

    @PostMapping("/run")
    public ResponseEntity<ExecutionResponse> execute(
            @RequestBody ExecutionRequest request
    ) {

        ExecutionResponse response =
                executionService.execute(
                        request.getSourceCode()
                );

        if (!response.isSuccess()) {

            return ResponseEntity
                    .badRequest()
                    .body(response);
        }

        return ResponseEntity.ok(response);
    }
}