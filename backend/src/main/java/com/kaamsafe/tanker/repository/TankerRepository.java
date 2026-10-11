package com.kaamsafe.tanker.repository;
import com.kaamsafe.tanker.model.Tanker;
import org.springframework.data.jpa.repository.JpaRepository;
public interface TankerRepository extends JpaRepository<Tanker, String> {}
